import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export abstract class WebStorageService {

  static isStorageAvailable = (storageType: "localStorage" | "sessionStorage"): boolean => {
    try {
      let storage = window[storageType];
      let x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (err) {
      return err instanceof DOMException && (
        err.code === 22 || err.code === 1014 ||
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ) && window[storageType].length !== 0;
    }
  };

  static setItemInStorage = (storageType: "localStorage" | "sessionStorage", identifier: string, data: string): boolean => {
    try {
      window[storageType].setItem(identifier, data);
      return true;
    } catch {
      return false
    }
  };

  static getItemFromStorage = (storageType: "localStorage" | "sessionStorage", identifier: string): string | null => {
    return window[storageType].getItem(identifier);
  };
}
