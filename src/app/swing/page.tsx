'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three'

// 完全実装したalgo.jsの関数をインポート
import { calc_graphdata, processSwingDataFromJSON } from '../../lib/swingAnalyzer'

// クライアントサイドのみでレンダリングするためのThree.js表示コンポーネント
const SwingViewer = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [swingData, setSwingData] = useState<any>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(true)
  
  // JSONデータを読み込む
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/swing-data')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const data = await response.json()
        setSwingData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching swing data:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Three.jsシーンをセットアップ
  useEffect(() => {
    if (!mountRef.current || !swingData) return

    // レンダラー、シーン、カメラのセットアップ
    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight
    
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 1)
    mountRef.current.appendChild(renderer.domElement)
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x2a2a2a)
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(2, 2, 4)
    camera.lookAt(0, 0, 0)
    
    // 光源の追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 2, 3)
    scene.add(directionalLight)
    
    // OrbitControlsの設定
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    
    // グリッド追加（床）
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444)
    scene.add(gridHelper)

    // ゴルファーのスタンス位置を示すマーカー
    const standPosition = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32),
      new THREE.MeshBasicMaterial({ color: 0x888888 })
    )
    standPosition.position.set(0, 0.01, 0)
    scene.add(standPosition)
    
    // ボール位置を示すマーカー
    const ballPosition = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    ballPosition.position.set(1.5, 0.05, 0)
    scene.add(ballPosition)
    
    // スイングデータから軌道を計算して表示
    if (swingData && swingData.data) {
      try {
        // algo.jsの関数を使用してスイングデータを処理
        const graphData = calc_graphdata(swingData)
        const { trajectoryData } = graphData
        
        if (trajectoryData) {
          // ヘッド軌道を取得
          const headTrajectory = trajectoryData.headTrajectory
          const gripTrajectory = trajectoryData.gripTrajectory
          const shaftPositions = trajectoryData.shaftPositions
          
          // THREE.jsのVector3に変換
          const headPoints = headTrajectory.map(p => new THREE.Vector3(p[0], p[1], p[2]))
          const gripPoints = gripTrajectory.map(p => new THREE.Vector3(p[0], p[1], p[2]))
          
          // ヘッド軌道の描画
          const headGeometry = new THREE.BufferGeometry().setFromPoints(headPoints)
          const headMaterial = new THREE.LineBasicMaterial({ color: 0x4285f4, linewidth: 3 })
          const headCurve = new THREE.Line(headGeometry, headMaterial)
          scene.add(headCurve)
          
          // グリップ軌道の描画（オプション）
          const gripGeometry = new THREE.BufferGeometry().setFromPoints(gripPoints)
          const gripMaterial = new THREE.LineBasicMaterial({ color: 0x34a853, linewidth: 2 })
          const gripCurve = new THREE.Line(gripGeometry, gripMaterial)
          scene.add(gripCurve)
          
          // クラブヘッドの表現（球体）
          const headMeshGeometry = new THREE.SphereGeometry(0.1, 16, 16)
          const headMeshMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.7,
            roughness: 0.3
          })
          const headMesh = new THREE.Mesh(headMeshGeometry, headMeshMaterial)
          headMesh.position.copy(headPoints[0])
          scene.add(headMesh)
          
          // グリップの表現（小さな円柱）
          const gripMeshGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16)
          const gripMeshMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.3,
            roughness: 0.7
          })
          const gripMesh = new THREE.Mesh(gripMeshGeometry, gripMeshMaterial)
          gripMesh.position.copy(gripPoints[0])
          gripMesh.rotation.x = Math.PI / 2 // 円柱を水平方向に向ける
          scene.add(gripMesh)
          
          // シャフトの表現（線）
          const shaftGeometry = new THREE.BufferGeometry().setFromPoints([
            gripPoints[0],
            headPoints[0]
          ])
          const shaftMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 })
          const shaft = new THREE.Line(shaftGeometry, shaftMaterial)
          scene.add(shaft)
          
          // アニメーション用の変数
          let frame = 0
          const totalFrames = headPoints.length - 1
          let lastTime = 0
          let animationId: number
          
          // アニメーション関数
          const animate = (time: number) => {
            animationId = requestAnimationFrame(animate)
            
            // 時間経過に基づくフレーム更新（再生速度調整可能）
            if (isPlaying) {
              const deltaTime = time - lastTime
              if (deltaTime > (1000 / 60) / playbackSpeed) { // 60fpsを基準
                // ヘッドとグリップの位置を更新
                frame = (frame + 1) % totalFrames
                lastTime = time
              }
            }
            
            // ヘッドとグリップの位置を更新
            headMesh.position.copy(headPoints[frame])
            
            // グリップの位置と回転を更新
            gripMesh.position.copy(gripPoints[frame])
            
            // グリップの向きをヘッドに向ける
            const direction = new THREE.Vector3().subVectors(headPoints[frame], gripPoints[frame]).normalize()
            const axis = new THREE.Vector3(0, 1, 0) // 初期の向き
            gripMesh.quaternion.setFromUnitVectors(axis, direction)
            
            // シャフトの更新
            shaft.geometry.dispose()
            shaft.geometry = new THREE.BufferGeometry().setFromPoints([
              gripPoints[frame],
              headPoints[frame]
            ])
            
            controls.update()
            renderer.render(scene, camera)
          }
          
          // アニメーション開始
          animate(0)
          
          // リサイズハンドラー
          const handleResize = () => {
            if (!mountRef.current) return
            
            const width = mountRef.current.clientWidth
            const height = mountRef.current.clientHeight
            
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
          }
          
          window.addEventListener('resize', handleResize)
          
          // クリーンアップ関数
          return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationId)
            
            if (mountRef.current) {
              mountRef.current.removeChild(renderer.domElement)
            }
            
            // メモリ解放
            scene.clear()
            renderer.dispose()
            headGeometry.dispose()
            headMaterial.dispose()
            gripGeometry.dispose()
            gripMaterial.dispose()
            shaftGeometry.dispose()
            shaftMaterial.dispose()
          }
        }
      } catch (error) {
        console.error('Error setting up swing visualization:', error)
      }
    }
  }, [swingData, playbackSpeed, isPlaying])
  
  return (
    <div className="flex flex-col min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">ゴルフスイングビューワー</h1>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl">データを読み込み中...</p>
        </div>
      ) : !swingData ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-red-500">データの読み込みに失敗しました</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          <div className="flex-1 flex flex-col">
            <div 
              ref={mountRef} 
              className="flex-1 min-h-[400px] bg-gray-900 rounded-lg shadow-lg"
            />
            
            <div className="mt-4 p-3 bg-gray-900 rounded-lg shadow flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  {isPlaying ? '一時停止' : '再生'}
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm">再生速度:</span>
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="px-2 py-1 border rounded"
                  >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    const el = mountRef.current
                    if (el) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen()
                      } else {
                        el.requestFullscreen()
                      }
                    }
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm"
                >
                  フルスクリーン
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/3 p-4 bg-gray-900 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2">スイング情報</h2>
            
            {swingData && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold border-b pb-1 mb-2">基本情報</h3>
                  <p>日付: {swingData.swing?.date || 'N/A'}</p>
                  <p>クラブ: {swingData.swing?.clubType || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold border-b pb-1 mb-2">スピード</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-600">ヘッドスピード:</p>
                      <p className="text-lg font-medium">{swingData.data?.speed?.impactHeadSpeed || 'N/A'} m/s</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">グリップスピード:</p>
                      <p className="text-lg font-medium">{swingData.data?.speed?.impactGripSpeed || 'N/A'} m/s</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold border-b pb-1 mb-2">インパクト情報</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">クラブパス:</p>
                        <p className={`font-medium ${Number(swingData.data?.angle?.impactClubPath) > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {swingData.data?.angle?.impactClubPath || 'N/A'} ({swingData.data?.angle?.impactClubPathType || 'N/A'})
                        </p>
                      </div>
                      <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
                        <div 
                          className={`h-full rounded-full ${Number(swingData.data?.angle?.impactClubPath) > 0 ? 'bg-red-600' : 'bg-blue-600'}`}
                          style={{ 
                            width: `${Math.min(Math.abs(Number(swingData.data?.angle?.impactClubPath || 0)) * 5, 100)}%`,
                            marginLeft: Number(swingData.data?.angle?.impactClubPath) > 0 ? '50%' : 'auto',
                            marginRight: Number(swingData.data?.angle?.impactClubPath) < 0 ? '50%' : 'auto',
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">フェース角:</p>
                        <p className={`font-medium ${Number(swingData.data?.angle?.impactFaceAngle) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {swingData.data?.angle?.impactFaceAngle || 'N/A'} ({swingData.data?.angle?.impactFaceAngleType || 'N/A'})
                        </p>
                      </div>
                      <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
                        <div 
                          className={`h-full rounded-full ${Number(swingData.data?.angle?.impactFaceAngle) > 0 ? 'bg-yellow-600' : 'bg-green-600'}`}
                          style={{ 
                            width: `${Math.min(Math.abs(Number(swingData.data?.angle?.impactFaceAngle || 0)) * 5, 100)}%`,
                            marginLeft: Number(swingData.data?.angle?.impactFaceAngle) > 0 ? '50%' : 'auto',
                            marginRight: Number(swingData.data?.angle?.impactFaceAngle) < 0 ? '50%' : 'auto',
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">アタック角:</p>
                        <p className={`font-medium ${Number(swingData.data?.angle?.impactAttackAngle) > 0 ? 'text-purple-600' : 'text-orange-600'}`}>
                          {swingData.data?.angle?.impactAttackAngle || 'N/A'} ({swingData.data?.angle?.impactAttackAngleType || 'N/A'})
                        </p>
                      </div>
                      <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
                        <div 
                          className={`h-full rounded-full ${Number(swingData.data?.angle?.impactAttackAngle) > 0 ? 'bg-purple-600' : 'bg-orange-600'}`}
                          style={{ 
                            width: `${Math.min(Math.abs(Number(swingData.data?.angle?.impactAttackAngle || 0)) * 5, 100)}%`,
                            marginLeft: Number(swingData.data?.angle?.impactAttackAngle) > 0 ? '50%' : 'auto',
                            marginRight: Number(swingData.data?.angle?.impactAttackAngle) < 0 ? '50%' : 'auto',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// クライアントサイドでのみレンダリングするためのラッパー
const SwingViewerPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <p className="text-xl">読み込み中...</p>
    </div>}>
      <SwingViewer />
    </Suspense>
  )
}

export default SwingViewerPage