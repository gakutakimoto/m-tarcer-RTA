// src/app/components/SwingDataTable.tsx
import React from "react";

interface SwingData {
  id: number;
  estimateCarry: number;
  impactHeadSpeed: number;
  impactGripSpeed: number;
  impactClubPath: number;
  impactFaceAngle: number;
  faceToPath: number;
  impactAttackAngle: number;
}

interface Props {
  data: SwingData[];
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
}

export default function SwingDataTable({
  data,
  page,
  pageSize,
  onPageChange,
}: Props) {
  const totalPages = 5; // 固定表示数。必要ならAPIで全件数を返すよう拡張してください。

  return (
    <div>
      <table className="w-full text-white bg-card rounded-lg">
        <thead className="bg-header text-left border-b border-gray-700">
          <tr>
            {/* ↓ py-3 から py-2 に変更 */}
            <th className="text-right px-2 py-2 font-bold text-sm">ID</th>
            <th className="text-right px-2 py-2 font-bold text-sm">推定飛距離</th>
            <th className="text-right px-2 py-2 font-bold text-sm">ヘッドスピード</th>
            <th className="text-right px-2 py-2 font-bold text-sm">グリップスピード</th>
            <th className="text-right px-2 py-2 font-bold text-sm">クラブパス</th>
            <th className="text-right px-2 py-2 font-bold text-sm">フェース角</th>
            <th className="text-right px-2 py-2 font-bold text-sm">フェーストゥパス</th>
            <th className="text-right px-2 py-2 font-bold text-sm">アタック角</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {data.map((row) => (
            <tr key={row.id}>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1">{row.id}</td>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1 text-right">
                {row.estimateCarry.toFixed(1)} yd
              </td>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1 text-right">
                {row.impactHeadSpeed.toFixed(1)} m/s
              </td>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1 text-right">
                {row.impactGripSpeed.toFixed(1)} m/s
              </td>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1 text-right">
                {row.impactClubPath.toFixed(1)}°
              </td>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1 text-right">
                {row.impactFaceAngle.toFixed(1)}°
              </td>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1 text-right">
                {row.faceToPath.toFixed(1)}°
              </td>
              {/* ↓ py-3 から py-2 に変更 */}
              <td className="text-right px-3 py-1 text-right">
                {row.impactAttackAngle.toFixed(1)}°
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ページネーション (変更なし) */}
      <nav className="flex justify-center space-x-2 mt-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded-lg bg-header disabled:opacity-50"
        >
          ←
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`px-3 py-1 rounded-lg ${
              n === page ? "bg-accent" : "bg-card"
            }`}
          >
            {n}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={data.length < pageSize}
          className="px-3 py-1 rounded-lg bg-header disabled:opacity-50"
        >
          →
        </button>
      </nav>
    </div>
  );
}