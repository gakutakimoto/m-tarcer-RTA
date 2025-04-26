interface EstimateCardProps {
  value: number; // 推定飛距離（例：157.6）
}

export default function EstimateCard({ value }: EstimateCardProps) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-lg text-center w-40 h-20">
      <h2 className="text-gray-500 text-sm">推定飛距離</h2>
      <p className="text-3xl font-bold text-blue-600 mt-2">{value.toFixed(1)} yd</p>
    </div>
  );
}
