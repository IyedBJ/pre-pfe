import requests
import json
import re
import time

def extract_fallback(text):
    """Extraction de secours basée sur des regex si Ollama est indisponible."""
    result = {
        "salaire_brut": 0.0,
        "total_cotisations_salariales": 0.0,
        "total_charges_patronales": 0.0,
        "repas_restaurant": 0.0,
        "net_avant_impot": 0.0,
        "net_paye": 0.0
    }
    
    def find_amount(keywords, content):
        for kw in keywords:
            pattern = rf"{kw}.*?(\d[\d\s\.]*[,\.]\d{{2}})"
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                val = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    return float(val)
                except:
                    continue
        return 0.0

    result["salaire_brut"] = find_amount(["SALAIRE BRUT", "TOTAL BRUT"], text)
    result["net_paye"] = find_amount(["NET A PAYER", "NET VERSE", "NET A VERSER"], text)
    result["net_avant_impot"] = find_amount(["NET AVANT IMPOT", "NET FISCAL"], text)
    

    def find_all_repas_sum(keywords, content):
        total = 0.0
        found_lines = set()
        lines = content.split('\n')
        for i, line in enumerate(lines):
            for kw in keywords:
                if kw.upper() in line.upper() and i not in found_lines:
                    amounts = re.findall(r"(\d[\d\s\.]*[,\.]\d{2})", line)
                    if amounts:
                        val = amounts[-1].replace(' ', '').replace(',', '.')
                        try:
                            total += float(val)
                            found_lines.add(i)
                            break
                        except:
                            continue
        return total

    result["repas_restaurant"] = find_all_repas_sum(["TITRES RESTAURANT", "PANIER", "REPAS"], text)
    
    return result

def extract_ollama(text):
    text_snippet = text[:6000] if len(text) > 6000 else text
    
    prompt = f"""
      Tu es un extracteur de données OCR spécialisé dans les bulletins de paie français. 
      Extrais les montants financiers précis et retourne-les au format JSON plat.

      ### Données à extraire :
      - **salaire_brut** : Montant brut total
      - **total_cotisations_salariales** : Somme des cotisations payées par le salarié
      - **total_charges_patronales** : Montant total cotisations employeur
      - **repas_restaurant** : Montant titres-restaurant ou repas (Prendre la valeur de la colonne "Net" ou "A payer", PAS la base)
      - **net_avant_impot** : Net à payer avant impôt sur le revenu
      - **net_paye** : Net versé final (Net à payer)

      ### Règles :
      1. Retourne EXCLUSIVEMENT un JSON valide.
      2. Utilise le point (.) comme séparateur décimal (ex: 1234.56).
      3. Si une donnée est manquante, mets 0.0.

      Texte du PDF:
      {text_snippet}
    """
    
    max_retries = 2
    retry_delay = 1
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(
                "http://127.0.0.1:11434/api/generate",
                json={
                    "model": "llama3.2", 
                    "prompt": prompt, 
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0
                    }
                },
                timeout=90
            )
            response.raise_for_status()
            data = response.json()
            response_text = data.get("response", "").strip()

            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                clean_json = json_match.group(0)
                result = json.loads(clean_json)
            else:
                result = json.loads(response_text)

            expected_keys = [
                "salaire_brut", "total_cotisations_salariales", "total_charges_patronales",
                "repas_restaurant", "net_avant_impot", "net_paye"
            ]
            
            final_result = {"_source": "ollama"}
            for key in expected_keys:
                val = result.get(key, 0.0)
                if isinstance(val, (int, float)):
                    final_result[key] = float(val)
                elif isinstance(val, str):
                    s = re.sub(r'[^\d,\.\-]', '', val).replace(',', '.')
                    try:
                        final_result[key] = float(s)
                    except:
                        final_result[key] = 0.0
                else:
                    final_result[key] = 0.0

            return final_result
            
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            if attempt < max_retries:
                time.sleep(retry_delay)
                continue
            fallback_data = extract_fallback(text)
            fallback_data["_source"] = "fallback_regex"
            fallback_data["_warning"] = f"Ollama non joignable: {str(e)}"
            return fallback_data
        except Exception as e:
            fallback_data = extract_fallback(text)
            fallback_data["_source"] = "fallback_regex"
            fallback_data["_error"] = str(e)
            return fallback_data
