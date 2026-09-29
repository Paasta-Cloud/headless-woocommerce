'use client';
import {createContext,useContext} from 'react';
import {defaultDesign} from '../../lib/design';
export const StoreSettings=createContext(defaultDesign.settings);
export const useStoreSettings=()=>useContext(StoreSettings);
