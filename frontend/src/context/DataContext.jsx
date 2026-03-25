import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:7000/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error("Erreur lors du chargement des salariés dans DataContext:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const addMonthlyData = (data) => {
    setMonthlyData((prevData) => [...prevData, data]);

    setEmployees((prevEmployees) => 
      prevEmployees.map((emp) => {
        const empId = emp.id || emp._id;
        if (empId === data.employeeId) {
          return {
            ...emp,
            monthlyData: [...(emp.monthlyData || []), data]
          };
        }
        return emp;
      })
    );
    
    console.log("Données ajoutées:", data);
  };

  const value = {
    employees,
    monthlyData,
    loading,
    addMonthlyData,
    fetchEmployees
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
