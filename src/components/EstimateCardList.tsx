"use client";

import { useEffect, useState } from "react";
import EstimateCard from "./EstimateCard";

interface EstimateData {
  impactFaceAngle: number;
  estimateCarry: number;
}

export default function EstimateCardList() {
  const [data, setData] = useState<EstimateData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/bqtest");
      const json = await res.json();
      setData(json.rows);
    };
    fetchData();
  }, []);

  return (
    <div className="flex gap-4 mt-8 flex-wrap justify-center">
      {data.map((item, index) => (
        <EstimateCard key={index} value={item.estimateCarry} />
      ))}
    </div>
  );
}
