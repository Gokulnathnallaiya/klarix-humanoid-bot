'use client'

import { useMemo } from 'react'
import { Activity, ChevronRight } from 'lucide-react'

interface JointData {
  [key: string]: number
}

interface KinematicsPanelProps {
  joints?: JointData
  className?: string
}

// Group joints by body part
const JOINT_GROUPS = {
  'Head': ['HeadYaw', 'HeadPitch'],
  'Left Arm': ['LShoulderPitch', 'LShoulderRoll', 'LElbowYaw', 'LElbowRoll', 'LWristYaw'],
  'Right Arm': ['RShoulderPitch', 'RShoulderRoll', 'RElbowYaw', 'RElbowRoll', 'RWristYaw'],
  'Left Leg': ['LHipYawPitch', 'LHipRoll', 'LHipPitch', 'LKneePitch', 'LAnklePitch', 'LAnkleRoll'],
  'Right Leg': ['RHipYawPitch', 'RHipRoll', 'RHipPitch', 'RKneePitch', 'RAnklePitch', 'RAnkleRoll'],
}

// Joint limits (in degrees) for progress bar
const JOINT_LIMITS: { [key: string]: [number, number] } = {
  'HeadYaw': [-120, 120],
  'HeadPitch': [-40, 30],
  'LShoulderPitch': [-120, 120],
  'LShoulderRoll': [-20, 95],
  'LElbowYaw': [-120, 120],
  'LElbowRoll': [-90, 0],
  'LWristYaw': [-105, 105],
  'RShoulderPitch': [-120, 120],
  'RShoulderRoll': [-95, 20],
  'RElbowYaw': [-120, 120],
  'RElbowRoll': [0, 90],
  'RWristYaw': [-105, 105],
  'LHipYawPitch': [-65, 42],
  'LHipRoll': [-45, 22],
  'LHipPitch': [-88, 28],
  'LKneePitch': [-5, 121],
  'LAnklePitch': [-68, 53],
  'LAnkleRoll': [-45, 22],
  'RHipYawPitch': [-65, 42],
  'RHipRoll': [-22, 45],
  'RHipPitch': [-88, 28],
  'RKneePitch': [-5, 121],
  'RAnklePitch': [-68, 53],
  'RAnkleRoll': [-22, 45],
}

function getJointProgress(name: string, value: number): number {
  const limits = JOINT_LIMITS[name]
  if (!limits) return 50

  const [min, max] = limits
  const range = max - min
  const progress = ((value - min) / range) * 100
  return Math.max(0, Math.min(100, progress))
}

function getJointColor(progress: number): string {
  if (progress < 20 || progress > 80) return 'bg-amber-500'
  return 'bg-blue-500'
}

export default function KinematicsPanel({ joints = {}, className = '' }: KinematicsPanelProps) {
  const groupedJoints = useMemo(() => {
    const groups: { [key: string]: { name: string; value: number; progress: number }[] } = {}

    Object.entries(JOINT_GROUPS).forEach(([groupName, jointNames]) => {
      groups[groupName] = jointNames.map(name => ({
        name,
        value: joints[name] ?? 0,
        progress: getJointProgress(name, joints[name] ?? 0)
      }))
    })

    return groups
  }, [joints])

  const hasData = Object.keys(joints).length > 0

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          Joint Kinematics
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {Object.keys(joints).length} joints
        </span>
      </div>

      {!hasData ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No joint data available</p>
          <p className="text-xs mt-1">Connect to robot to see kinematics</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(groupedJoints).map(([groupName, groupJoints]) => (
            <div key={groupName}>
              <div className="flex items-center gap-1 mb-2">
                <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{groupName}</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {groupJoints.map(joint => (
                  <div key={joint.name} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-28 truncate" title={joint.name}>
                      {joint.name.replace(/[LR]/, '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getJointColor(joint.progress)}`}
                        style={{ width: `${joint.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-700 dark:text-slate-300 w-12 text-right font-mono">
                      {joint.value.toFixed(1)}°
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mini Robot Visualization */}
      {hasData && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-center">
            <svg viewBox="0 0 100 140" className="w-24 h-32">
              {/* Simple robot silhouette with joint indicators */}
              {/* Head */}
              <circle cx="50" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
              <circle cx="50" cy="15" r="3" fill="currentColor" className="text-blue-500" />

              {/* Body */}
              <rect x="35" y="30" width="30" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />

              {/* Left Arm */}
              <line x1="35" y1="35" x2="15" y2="55" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
              <circle cx="35" cy="35" r="3" fill="currentColor" className="text-blue-500" />
              <circle cx="25" cy="45" r="2" fill="currentColor" className="text-blue-400" />

              {/* Right Arm */}
              <line x1="65" y1="35" x2="85" y2="55" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
              <circle cx="65" cy="35" r="3" fill="currentColor" className="text-blue-500" />
              <circle cx="75" cy="45" r="2" fill="currentColor" className="text-blue-400" />

              {/* Left Leg */}
              <line x1="42" y1="70" x2="38" y2="100" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
              <line x1="38" y1="100" x2="35" y2="130" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
              <circle cx="42" cy="70" r="3" fill="currentColor" className="text-blue-500" />
              <circle cx="38" cy="100" r="2" fill="currentColor" className="text-blue-400" />

              {/* Right Leg */}
              <line x1="58" y1="70" x2="62" y2="100" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
              <line x1="62" y1="100" x2="65" y2="130" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600" />
              <circle cx="58" cy="70" r="3" fill="currentColor" className="text-blue-500" />
              <circle cx="62" cy="100" r="2" fill="currentColor" className="text-blue-400" />
            </svg>
          </div>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">Joint positions</p>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(148 163 184 / 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184 / 0.5);
        }
      `}</style>
    </div>
  )
}
