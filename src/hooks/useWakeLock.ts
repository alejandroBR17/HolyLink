import {useCallback,useEffect,useSyncExternalStore} from 'react';
import {isWakeLockActive,isWakeLockRequested,isWakeLockSupported,requestWakeLock,releaseWakeLock,resumeWakeLock,subscribeWakeLock} from '../utils/wakeLock';

export function useWakeLock(autoEnable=true){
  const isActive=useSyncExternalStore(subscribeWakeLock,isWakeLockActive,()=>false);
  const isRequested=useSyncExternalStore(subscribeWakeLock,isWakeLockRequested,()=>false);
  const enable=useCallback(()=>requestWakeLock(),[]);
  const disable=useCallback(()=>releaseWakeLock(),[]);
  useEffect(()=>{if(autoEnable)void resumeWakeLock();},[autoEnable]);
  return{isSupported:isWakeLockSupported(),isActive,isRequested,enable,disable};
}
