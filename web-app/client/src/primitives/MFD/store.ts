import {atom, useAtom} from 'jotai';
import { useState, useCallback, useEffect, useRef } from 'react';
import useMFDTask from '@hooks/useMFDTask';
import { MFDHighlight } from '@atoms/MFDTaskAtom';
import useMFDHighlight from '@hooks/useMFDHighlight';
import { MFDOrderingParameter, OrderDirection } from 'types/globalTypes';

const defaultLimit = 150;

type InsertedRow =
  | {
    position: number;
    data: MFDHighlight;
  }
  | undefined;

export const clusterIndexAtom = atom(0);
export const limitAtom = atom(defaultLimit);
export const parameterAtom = atom(MFDOrderingParameter.MAXIMUM_DISTANCE);
export const orderDirectionAtom = atom(OrderDirection.ASC);
export const isInsertedAtom = atom(false);
export const furthestIndexAtom = atom(0);
export const rowIndexAtom = atom(0);
export const furthestDataAtom = atom<InsertedRow | undefined>(undefined);
export const isOrderingShownAtom = atom(false);
export const showFullValueAtom = atom(false);

