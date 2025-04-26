import React from "react";

interface Props {
  factors: {
    feature: string;
    importance: number;
    median: number;
    actual: number | null;
    unit: string;
  }[];
}

const featureNameMap: { [key: string]: string } = {
    addressHandFirst: "アドレス ハンドファースト",
    addressLieAngle: "アドレス時ライ角",
    halfwaydownFaceAngleToVertical: "ダウンスイング フェース角",
    halfwaybackFaceAngleToVertical: "ハーフウェイバック フェース角",
    topFaceAngleToHorizontal: "トップ フェース角",
    downSwingShaftRotationMin: "ダウンスイングシャフト回転",
    impactGripSpeed: "グリップスピード",
    impactAttackAngle: "アタック角",
  };
  
  const featureUnitMap: { [key: string]: string } = {
    addressHandFirst: "",
    addressLieAngle: "°",
    halfwaydownFaceAngleToVertical: "°",
    halfwaybackFaceAngleToVertical: "°",
    topFaceAngleToHorizontal: "°",
    downSwingShaftRotationMin: "dps",
    impactGripSpeed: "m/s",
    impactAttackAngle: "°",
  };
  

const SuccessFactorsTable = ({ factors }: Props) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow-md mt-2">
      <h2 className="text-left text-sm text-gray-300 mb-2 font-semibold">成功へのカギ このクラスタタイプの成功スイングへの寄与度</h2>
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-gray-400 border-b border-gray-700">
          <tr>
            <th className="py-1">指標（プロセス名）</th>
            <th className="py-1 text-right">成功寄与度(%)</th>
            <th className="py-1 text-right">ターゲット数値</th>
            <th className="py-1 text-right">あなたの値</th>
            <th className="py-1 text-right">差分</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((item, index) => {
            const diff =
              item.actual !== null && !isNaN(item.actual)
                ? (item.actual - item.median).toFixed(1)
                : "---";
            return (
              <tr key={index} className="border-t border-gray-800 hover:bg-gray-800/30">
<td className="py-1 pr-4">{featureNameMap[item.feature] || item.feature}</td>
<td className="py-1 text-right text-yellow-300">{(item.importance * 100).toFixed(1)}%</td>
                <td className="py-1 text-right">{item.median.toFixed(1)}{item.unit}</td>
                <td className="py-1 text-right font-medium text-white">
                  {item.actual !== null ? item.actual.toFixed(1) + item.unit : "---"}
                </td>
                <td className="py-1 text-right font-medium text-blue-300">
                  {diff}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SuccessFactorsTable;
