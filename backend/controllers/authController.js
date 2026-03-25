const ldap = require("ldapjs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");         //comparer les mots de passe cryptés
const User = require("../models/User"); 

const LDAP_URL = process.env.LDAP_URL || "ldap://192.168.1.29:389";
const DOMAIN = process.env.LDAP_DOMAIN || "ELZEI"; 
const SEARCH_BASE = process.env.LDAP_SEARCH_BASE || "DC=elzei,DC=local";

exports.loginAD = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis" });
  }

  let adUser = username;
  if (!username.includes("@") && !username.includes("\\")) {
    adUser = `${DOMAIN}\\${username}`;
  }

  const loginLocal = async (msg) => {
    console.log(`Bascule vers l'authentification locale: ${msg}`);
    try {
      const cleanUsername = username.includes("\\") ? username.split("\\").pop() : username;
      const user = await User.findOne({ username: cleanUsername });

      if (!user || !user.password) {
        return res.status(401).json({ 
          message: "Authentification locale impossible (Utilisateur non trouvé)" 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Identifiants invalides (Local)" });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role || "user" },
        process.env.JWT_SECRET || "votre_secret_jwt",
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        message: "Connexion réussie (Local)",
        token,
        user: { username: user.username, role: user.role || "user" }
      });
    } catch (err) {
      console.error("Erreur Auth Locale:", err);
      return res.status(500).json({ message: "Erreur serveur lors de l'authentification locale" });
    }
  };

  const client = ldap.createClient({ 
    url: LDAP_URL,
    connectTimeout: 3000, 
    timeout: 5000
  });

  client.on("error", (err) => {
    console.error("LDAP Client Error:", err.message);
  });

  client.bind(adUser, password, async (err) => {
    if (err) {
      console.error("Erreur Login AD:", err.message);
      try { client.unbind(); } catch(e) {}

      const isNetworkError = err.message.includes("ECONNREFUSED") || 
                            err.message.includes("ETIMEDOUT") || 
                            err.message.includes("timeout");
      
      if (isNetworkError && process.env.LDAP_FALLBACK === "true") {
        return loginLocal("Serveur AD injoignable");
      }

      return res.status(401).json({ message: `Erreur de connexion AD: ${err.message}` });
    }

    console.log("Login AD réussi pour:", adUser);

    const cleanUsername = username.includes("\\")
      ? username.split("\\").pop()
      : username;

    const searchFilter = `(sAMAccountName=${cleanUsername})`;
    const searchOptions = {
      filter: searchFilter,
      scope: "sub",                 //Chercher dans tout le domaine AD.
      attributes: ["memberOf"]
    };

    client.search(SEARCH_BASE, searchOptions, (searchErr, searchRes) => {
      if (searchErr) {
        console.error("Erreur Recherche AD:", searchErr);
        client.unbind();
        return res.status(500).json({ message: "Erreur lors de la récupération des groupes AD" });
      }

      let memberOf = [];
      searchRes.on("searchEntry", (entry) => {
        const attributes = entry.pojo.attributes;
        const memberOfAttr = attributes.find(attr => attr.type === "memberOf");
        if (memberOfAttr) {
          memberOf = memberOfAttr.values;
        }
      });

      searchRes.on("error", (err) => {
        console.error("Erreur Flux Recherche AD:", err.message);
        client.unbind();
        res.status(500).json({ message: "Erreur serveur AD" });
      });

      searchRes.on("end", async (result) => {
        let role = "user"; 
        const isMemberOf = (groupName) => memberOf.some(group => group.includes(groupName));

        if (isMemberOf("ADMIN_TEAM")) {
          role = "admin";
        } else if (isMemberOf("FINANCE_TEAM")) {
          role = "finance";
        }

        try {
          let user = await User.findOne({ username: cleanUsername });

          if (!user) {
            console.log("Nouvel utilisateur AD");
            user = await User.create({
              username: cleanUsername,
              role: role 
            });
          } else {
            
            user.role = role;
            await user.save();
          }

          const token = jwt.sign(
            { 
              id: user._id,
              username: user.username,
              role: role 
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          client.unbind();

          res.status(200).json({
            message: "Connexion réussie",
            token,
            user: {
              username: user.username,
              role: role
            }
          });

        } catch (dbError) {
          console.error("Erreur MongoDB:", dbError);
          client.unbind();
          res.status(500).json({ message: "Erreur serveur" });
        }
      });
    });
  });
};
