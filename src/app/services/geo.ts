import { Injectable, signal } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root',
})
export class Geo {
  movingPosition = signal<{lat: number, lng:number} | null>(null)
  async getCurrentLocation(){
    const pos  = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    }
  }

  async watchPosition(){
    const watchId = await Geolocation.watchPosition({
      enableHighAccuracy: true
    }, (pos)=>{
      if(pos){
        this.movingPosition.set({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
      }
    })
    return watchId;
  }

  async clearWatch(watchId: string) {
    await Geolocation.clearWatch({ id: watchId });
  }
}
