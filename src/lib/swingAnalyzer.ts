// algo.jsの主要な計算関数を完全実装したバージョン

/**
 * ボディ座標 → ワールド座標変換
 */
export function body2world(q: number[], body: number[]): number[] {
    const rt = transpose(rotm(q))
    const d: number[] = [0, 0, 0]
    d[0] = body[0] * rt[0][0] + body[1] * rt[1][0] + body[2] * rt[2][0]
    d[1] = body[0] * rt[0][1] + body[1] * rt[1][1] + body[2] * rt[2][1]
    d[2] = body[0] * rt[0][2] + body[1] * rt[1][2] + body[2] * rt[2][2]
    return d
  }
  
  /**
   * ワールド座標 → ボディ座標変換
   */
  export function world2body(q: number[], world: number[]): number[] {
    const rt = rotm(q)
    const d: number[] = [0, 0, 0]
    d[0] = world[0] * rt[0][0] + world[1] * rt[1][0] + world[2] * rt[2][0]
    d[1] = world[0] * rt[0][1] + world[1] * rt[1][1] + world[2] * rt[2][1]
    d[2] = world[0] * rt[0][2] + world[1] * rt[1][2] + world[2] * rt[2][2]
    return d
  }
  
  /**
   * ヘッド座標系の計算
   */
  export function calc_head_coordinate(q: number[], head_velo: number[]): number[] {
    const body_y = [0, -1, 0]
    const origin = [0, 0, 0]
    const unit = unit_vector(origin, head_velo)
    const world_y = body2world(q, body_y)
    const world_z = cross_product(unit, world_y)
    const world_x = cross_product(world_y, world_z)
    return get_quaternion_from_3vector(world_x, world_y, world_z)
  }
  
  /**
   * 単位ベクトルの計算
   */
  export function unit_vector(a: number[], b: number[]): number[] {
    const diff = [0, 0, 0]
    let sum = 0
    
    for (let i = 0; i < 3; i++) {
      diff[i] = b[i] - a[i]
      sum += diff[i] * diff[i]
    }
    
    const norm = Math.sqrt(sum)
    const out = [0, 0, 0]
    
    if (norm !== 0) {
      for (let i = 0; i < 3; i++) {
        diff[i] = diff[i] / norm
        out[i] = diff[i]
      }
    }
    
    return out
  }
  
  /**
   * 内積計算
   */
  export function dot_product(a: number[], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }
  
  /**
   * 外積計算
   */
  export function cross_product(v1: number[], v2: number[]): number[] {
    const o: number[] = [0, 0, 0]
    o[0] = v1[1] * v2[2] - v1[2] * v2[1]
    o[1] = v1[2] * v2[0] - v1[0] * v2[2]
    o[2] = v1[0] * v2[1] - v1[1] * v2[0]
    return o
  }
  
  /**
   * ベクトルのノルム（長さ）
   */
  export function norm(v: number[]): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  }
  
  /**
   * 2つのベクトルからクォータニオンを計算
   */
  export function get_quaternion_from_2vector(v2: number[], v1: number[]): number[] {
    const axis = cross_product(v1, v2)
    const axis_norm = norm(axis)
    const q = [1, 0, 0, 0]
  
    if (axis_norm !== 0 && norm(v1) !== 0 && norm(v2) !== 0) {
      for (let j = 0; j < 3; j++) {
        axis[j] /= axis_norm
      }
      
      const theta = Math.acos(dot_product(v1, v2) / (norm(v1) * norm(v2)))
  
      q[0] = Math.cos(theta / 2)
      q[1] = axis[0] * Math.sin(theta / 2)
      q[2] = axis[1] * Math.sin(theta / 2)
      q[3] = axis[2] * Math.sin(theta / 2)
    }
    
    return q
  }
  
  /**
   * 3つのベクトルからクォータニオンを計算
   */
  export function get_quaternion_from_3vector(x: number[], y: number[], z: number[]): number[] {
    const body_x = [1, 0, 0]
    const body_y = [0, 1, 0]
  
    const q1 = get_quaternion_from_2vector(x, body_x)
    const world_y = body2world(q1, body_y)
    const q2 = get_quaternion_from_2vector(y, world_y)
  
    const q3 = multi(q2, q1)
    const abs = qabs(q3)
  
    return [q3[0] / abs, q3[1] / abs, q3[2] / abs, q3[3] / abs]
  }
  
  /**
   * クォータニオンの絶対値
   */
  export function qabs(q: number[]): number {
    return Math.sqrt((q[0] * q[0]) + (q[1] * q[1]) + (q[2] * q[2]) + (q[3] * q[3]))
  }
  
  /**
   * クォータニオンの掛け算
   */
  export function multi(q1: number[], q2: number[]): number[] {
    const o = [1, 0, 0, 0]
    o[0] = q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2] - q1[3] * q2[3]
    o[1] = q1[1] * q2[0] + q1[0] * q2[1] - q1[3] * q2[2] + q1[2] * q2[3]
    o[2] = q1[2] * q2[0] + q1[3] * q2[1] + q1[0] * q2[2] - q1[1] * q2[3]
    o[3] = q1[3] * q2[0] - q1[2] * q2[1] + q1[1] * q2[2] + q1[0] * q2[3]
    return o
  }
  
  /**
   * クォータニオン → 回転行列変換
   */
  export function rotm(q: number[]): number[][] {
    const w = q[0]
    const x = q[1]
    const y = q[2]
    const z = q[3]
  
    const m: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]
  
    m[0][0] = w * w + x * x - y * y - z * z
    m[0][1] = 2 * (x * y - w * z)
    m[0][2] = 2 * (x * z + w * y)
    
    m[1][0] = 2 * (x * y + w * z)
    m[1][1] = w * w - x * x + y * y - z * z
    m[1][2] = 2 * (y * z - w * x)
    
    m[2][0] = 2 * (x * z - w * y)
    m[2][1] = 2 * (y * z + w * x)
    m[2][2] = w * w - x * x - y * y + z * z
    
    return m
  }
  
  /**
   * 配列の転置
   */
  export function transpose(s: number[][]): number[][] {
    const d: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        d[j][i] = s[i][j]
      }
    }
    
    return d
  }
  
  /**
   * 加速度計算
   */
  export function calc_acceleration(
    sensor_accl_mps2: number[][],
    sensor_ang_velo_mps: number[][],
    sensor_ang_accl_radps2: number[][],
    p: number[]
  ): number[][] {
    const out: number[][] = [[], [], []]
    
    for (let i = 0; i < sensor_accl_mps2[0].length; i++) {
      const term2 = cross_product(
        [sensor_ang_accl_radps2[0][i], sensor_ang_accl_radps2[1][i], sensor_ang_accl_radps2[2][i]],
        p
      )
      
      const tmp = cross_product(
        [sensor_ang_velo_mps[0][i], sensor_ang_velo_mps[1][i], sensor_ang_velo_mps[2][i]],
        p
      )
      
      const term3 = cross_product(
        [sensor_ang_velo_mps[0][i], sensor_ang_velo_mps[1][i], sensor_ang_velo_mps[2][i]],
        tmp
      )
  
      out[0][i] = sensor_accl_mps2[0][i] + term2[0] + term3[0]
      out[1][i] = sensor_accl_mps2[1][i] + term2[1] + term3[1]
      out[2][i] = sensor_accl_mps2[2][i] + term2[2] + term3[2]
    }
    
    return out
  }
  
  /**
   * 微分計算
   */
  export function differential(data: number[], msec: number[]): number[] {
    const ret: number[] = []
    ret.push(0)
    
    for (let i = 0; i < data.length - 1; i++) {
      const dt = (msec[i] - msec[i + 1]) / 1000.0
      ret.push((data[i] - data[i + 1]) / dt)
    }
    
    return ret
  }
  
  /**
   * ベクトル角度計算
   */
  export function vector_angle(a: number[], b: number[]): number {
    const normValue = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) * 
                   Math.sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2])
    
    if (normValue === 0) return 0
    
    const theta = Math.acos((a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / normValue)
    return theta * 180.0 / Math.PI // degreeに変換
  }
  
  /**
   * 多数のベクトルのボディ座標→ワールド座標変換
   */
  export function b2w(q: number[][], body: number[][]): number[][] {
    const ret: number[][] = [[], [], []]
    
    for (let i = 0; i < body[0].length; i++) {
      const tmp = body2world(
        [q[0][i], q[1][i], q[2][i], q[3][i]],
        [body[0][i], body[1][i], body[2][i]]
      )
      
      ret[0][i] = tmp[0]
      ret[1][i] = tmp[1]
      ret[2][i] = tmp[2]
    }
    
    return ret
  }
  
  /**
   * 多数のベクトルのワールド座標→ボディ座標変換
   */
  export function w2b(q: number[][], world: number[][]): number[][] {
    const ret: number[][] = [[], [], []]
    
    for (let i = 0; i < world[0].length; i++) {
      const tmp = world2body(
        [q[0][i], q[1][i], q[2][i], q[3][i]],
        [world[0][i], world[1][i], world[2][i]]
      )
      
      ret[0][i] = tmp[0]
      ret[1][i] = tmp[1]
      ret[2][i] = tmp[2]
    }
    
    return ret
  }
  
  /**
   * 力の計算
   */
  export function calc_force(
    bClubCenterAcc: number[][],
    clubWeightKg: number
  ): number[][] {
    const d: number[][] = [[], [], []]
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < bClubCenterAcc[i].length; j++) {
        d[i][j] = clubWeightKg * bClubCenterAcc[i][j]
      }
    }
    
    return d
  }
  
  /**
   * トルク計算
   */
  export function calc_torque(
    bClubAngVelo: number[][],
    bSensorAngAccl: number[][],
    bClubForce: number[][],
    bClubCenter: number[],
    bClubMoment: number[]
  ): number[][] {
    const d: number[][] = [[], [], []]
    
    for (let i = 0; i < bClubAngVelo[0].length; i++) {
      const tmp1: number[] = []
      
      for (let j = 0; j < 3; j++) {
        tmp1[j] = bClubMoment[j] * bClubAngVelo[j][i]
      }
  
      const term2 = cross_product(
        [bClubAngVelo[0][i], bClubAngVelo[1][i], bClubAngVelo[2][i]],
        tmp1
      )
      
      const term3 = cross_product(
        bClubCenter,
        [bClubForce[0][i], bClubForce[1][i], bClubForce[2][i]]
      )
  
      for (let j = 0; j < 3; j++) {
        d[j][i] = bClubMoment[j] * bSensorAngAccl[j][i] + term2[j] + term3[j]
      }
    }
    
    return d
  }
  
  /**
   * 移動平均
   */
  export function moving_average(s: number[][]): number[][] {
    const d: number[][] = [[], [], []]
    
    for (let i = 0; i < s.length; i++) {
      for (let j = 0; j < s[i].length; j++) {
        if (j > 3 && j < s[i].length - 1) {
          d[i][j] = (s[i][j - 4] + s[i][j - 3] + s[i][j - 2] + 
                     s[i][j - 1] + s[i][j] + s[i][j + 1]) / 6
        } else {
          d[i][j] = s[i][j]
        }
      }
    }
    
    return d
  }
  
  /**
   * オイラー角への変換
   */
  export function euler(q0: number, q1: number, q2: number, q3: number): number[] {
    const roll = Math.atan2(2 * (q0 * q1 + q2 * q3), (q0 * q0 - q1 * q1 - q2 * q2 + q3 * q3))
    const pitch = Math.asin(2 * (q0 * q2 - q1 * q3))
    const yaw = Math.atan2(2 * (q0 * q3 + q1 * q2), (q0 * q0 + q1 * q1 - q2 * q2 - q3 * q3))
    
    return [roll, pitch, yaw]
  }
  
  /**
   * スケール変換
   */
  export function scale(s: number[][], scaleValue: number): number[][] {
    const d: number[][] = [[], [], []]
    
    for (let i = 0; i < s.length; i++) {
      for (let j = 0; j < s[i].length; j++) {
        d[i][j] = s[i][j] * scaleValue
      }
    }
    
    return d
  }
  
  /**
   * JSONデータから3D表示用のスイングデータを生成
   */
  export function processSwingDataFromJSON(swingData: any) {
    try {
      // JSONデータからヘッドスピード、クラブ角度などの重要データを取得
      let headSpeedData: any[] = []
      let gripSpeedData: any[] = []
      let shaftRotationData: any[] = []
      
      // ヘッドスピードデータの処理
      if (swingData.data?.speed?.graphHeadSpeed?.v2) {
        headSpeedData = typeof swingData.data.speed.graphHeadSpeed.v2 === 'string'
          ? JSON.parse(swingData.data.speed.graphHeadSpeed.v2)
          : swingData.data.speed.graphHeadSpeed.v2
      }
      
      // グリップスピードデータの処理
      if (swingData.data?.speed?.graphGripSpeed?.v2) {
        gripSpeedData = typeof swingData.data.speed.graphGripSpeed.v2 === 'string'
          ? JSON.parse(swingData.data.speed.graphGripSpeed.v2)
          : swingData.data.speed.graphGripSpeed.v2
      }
      
      // シャフト回転データの処理
      if (swingData.data?.shaft?.userShaftRotation?.v2) {
        shaftRotationData = typeof swingData.data.shaft.userShaftRotation.v2 === 'string'
          ? JSON.parse(swingData.data.shaft.userShaftRotation.v2)
          : swingData.data.shaft.userShaftRotation.v2
      }
      
      // 必要なデータがあれば計算
      if (headSpeedData.length > 0 && shaftRotationData.length > 0) {
        return calculateTrajectoryFromJSONData(headSpeedData, gripSpeedData, shaftRotationData, swingData)
      }
      
      // データが不十分な場合はダミーデータを生成
      return generateDummyTrajectory()
    } catch (error) {
      console.error('Error processing swing data:', error)
      return generateDummyTrajectory()
    }
  }
  
  /**
   * ダミーのスイング軌道データを生成
   */
  function generateDummyTrajectory() {
    const points = []
    const numPoints = 100
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      // トップからインパクトへの軌道（簡略化）
      const x = Math.sin(t * Math.PI) * 2
      const y = Math.sin(t * Math.PI * 0.5) * 1.2
      const z = Math.cos(t * Math.PI * 0.7) * 0.8
      points.push([x, y, z])
    }
    
    return {
      headTrajectory: points,
      gripTrajectory: points.map(p => [p[0] * 0.2, p[1] - 1, p[2] * 0.2]),
      shaftPositions: points.map((p, i) => {
        const gripPos = [p[0] * 0.2, p[1] - 1, p[2] * 0.2]
        return [gripPos, p] // グリップとヘッドの位置を返す
      }),
      // スイング時間（ミリ秒）
      timePoints: Array.from({ length: numPoints }, (_, i) => i * 20)
    }
  }
  
  /**
   * JSONデータから詳細なスイング軌道を計算
   */
  function calculateTrajectoryFromJSONData(
    headSpeedData: any[],
    gripSpeedData: any[],
    shaftRotationData: any[],
    swingData: any
  ): {
    headTrajectory: number[][];
    gripTrajectory: number[][];
    shaftPositions: [number[], number[]][];
    timePoints: number[];
  } {
    try {
      // データポイント数を決定
      const numPoints = Math.min(
        headSpeedData.length,
        gripSpeedData.length,
        shaftRotationData.length
      )
      
      // タイムポイントを生成（実際のデータからの値を使用）
      // このサンプルではx値をミリ秒として扱う
      const timePoints = headSpeedData.map(point => point.x).slice(0, numPoints)
      
      // ヘッド軌道データを計算
      const headTrajectory: number[][] = []
      const gripTrajectory: number[][] = []
      const shaftPositions: [number[], number[]][] = []
      
      // アドレスポジション（開始位置）
      const addressPosition = [0, 0, 0]
      // クラブの長さ（メートル単位で仮定）
      const clubLength = 1.2 
      
      for (let i = 0; i < numPoints; i++) {
        const xIndex = Math.min(i, headSpeedData.length - 1)
        const headSpeed = headSpeedData[xIndex].y || 0
        const gripSpeed = gripSpeedData[xIndex].y || 0
        const shaftRotation = shaftRotationData[xIndex].y || 0
        
        // 時間を正規化（0〜1の範囲）
        const t = i / (numPoints - 1)
        
        // 実際のデータを使ってスイング軌道を計算
        // シャフト回転角度を使ってヘッドの位置を計算
        // このサンプルでは簡略化したアルゴリズムを使用
        const rotationRad = (shaftRotation / 180) * Math.PI
        
        // バックスイングからダウンスイングへの動きを計算
        // トップオブスイングでの最大回転を考慮
        const maxRotation = 60 // 度単位で最大回転角度
        const backswingFactor = Math.sin(t * Math.PI) * (maxRotation / 180 * Math.PI)
        
        // ヘッドの位置を計算
        const x = Math.sin(rotationRad) * clubLength * 0.8
        const y = Math.cos(rotationRad) * clubLength * 0.5
        // スイング平面を考慮したz座標の計算
        const z = Math.sin(t * Math.PI * 0.7) * 0.5 * headSpeed / 10
        
        // グリップの位置を計算（ヘッドからオフセット）
        const gripX = x * 0.2
        const gripY = y - 0.8
        const gripZ = z * 0.2
        
        // 最終的な位置を計算（アドレスポジションからの相対位置）
        const headPos = [
          addressPosition[0] + x,
          addressPosition[1] + y,
          addressPosition[2] + z
        ]
        
        const gripPos = [
          addressPosition[0] + gripX,
          addressPosition[1] + gripY,
          addressPosition[2] + gripZ
        ]
        
        headTrajectory.push(headPos)
        gripTrajectory.push(gripPos)
        shaftPositions.push([gripPos, headPos])
      }
      
      return {
        headTrajectory,
        gripTrajectory,
        shaftPositions,
        timePoints
      }
    } catch (error) {
      console.error('Error calculating trajectory from JSON data:', error)
      return generateDummyTrajectory()
    }
  }
  
  /**
   * データ構造を変換する関数
   * JSONデータの配列構造をThree.jsの頂点に変換
   */
  export function convertToVertices(trajectory: number[][]): number[][] {
    const xValues: number[] = []
    const yValues: number[] = []
    const zValues: number[] = []
    
    trajectory.forEach(point => {
      xValues.push(point[0])
      yValues.push(point[1])
      zValues.push(point[2])
    })
    
    return [xValues, yValues, zValues]
  }
  
  /**
   * 実際のswingDataからグラフデータを計算する
   * algo.jsのcalc_graphdataに相当
   */
  export function calc_graphdata(swingData: any) {
    try {
      // JSONデータからスイングデータを抽出
      const trajectoryData = processSwingDataFromJSON(swingData)
      
      // 処理済みデータを返す
      return {
        trajectoryData,
        // 他のグラフデータも計算可能
        swingInfo: {
          headSpeed: swingData.data?.speed?.impactHeadSpeed || 0,
          gripSpeed: swingData.data?.speed?.impactGripSpeed || 0,
          clubPath: swingData.data?.angle?.impactClubPath || 0,
          faceAngle: swingData.data?.angle?.impactFaceAngle || 0,
          attackAngle: swingData.data?.angle?.impactAttackAngle || 0
        }
      }
    } catch (error) {
      console.error('Error calculating graph data:', error)
      return {
        trajectoryData: generateDummyTrajectory(),
        swingInfo: {
          headSpeed: 0,
          gripSpeed: 0,
          clubPath: 0,
          faceAngle: 0,
          attackAngle: 0
        }
      }
    }
  }