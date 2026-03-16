"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type LocationContextType = {
    selectedNode: string;
    setSelectedNode: (node: string) => void;
    nodeOpen: boolean;
    setNodeOpen: (open: boolean) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedNode, setSelectedNode] = useState("Prestige Whitefield");
    const [nodeOpen, setNodeOpen] = useState(false);

    return (
        <LocationContext.Provider value={{ selectedNode, setSelectedNode, nodeOpen, setNodeOpen }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};
