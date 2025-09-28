import {
  AfterViewInit,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Geo } from '../services/geo';
import * as L from 'leaflet';
import {
  IonHeader, IonFooter, 
  IonToolbar,
  IonTitle,
  IonButton,
  IonCard,
  IonContent,
  IonLabel,
  IonAlert,
  IonLoading,
  IonGrid,
  IonCol,
  IonRow,
} from '@ionic/angular/standalone';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonCol,
    IonHeader, IonFooter, 
    IonToolbar,
    IonTitle,
    IonButton,
    IonCard,
    IonContent,
    IonLabel,
    IonAlert,
    IonLoading,
    IonGrid,
    IonRow,
  ],
})
export class HomePage implements AfterViewInit {
  isDisabled = true;
  isMapVisible = false;
  map!: L.Map;
  latlng: { lat: number; lng: number } = { lat: 0, lng: 0 };
  GeolocationService = inject(Geo);
  isAlertOpen = false;
  alertButtons = ['Refresh'];
  display_name = signal('');
  loader?: HTMLIonLoadingElement;
  trackingIndicator = 'Not tracking'

  distanceFromStart = signal(0);

  lastMarker?: L.CircleMarker;
  distanceLine?: L.Polyline<any>; // polyline from current to latest
  distanceTooltip?: L.Tooltip;

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
    window.location.reload();
  }

  async getCurrentLocation() {
    try {
      const coordinates = await this.GeolocationService.getCurrentLocation();
      console.log(coordinates);
      this.latlng = coordinates;
      setTimeout(() => this.mapInit(), 0);
      await this.hideLoading();
      this.isDisabled = false;
    } catch (error) {
      console.log('errorizing: ', error);
      await this.hideLoading();
      this.isAlertOpen = true;
    }
  }

  mapInit() {
    this.map = L.map('map', {
      center: [this.latlng.lat, this.latlng.lng],
      zoom: 19,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      this.map
    );
    L.circleMarker([this.latlng.lat, this.latlng.lng], {
      radius: 5,
      color: '#d62828',
    }).addTo(this.map);
    // const place1 = L.latLng([this.latlng.lat, this.latlng.lng]);
    // const place2 = L.latLng([15.656030431510047, 121.03969337560467]);
    // let distance = place1.distanceTo(place2);
    // L.polyline([
    //   [this.latlng.lat, this.latlng.lng],
    //   [15.656030431510047, 121.03969337560467],
    // ])
    //   .bindTooltip(`${distance}`, { permanent: true })
    //   .addTo(this.map);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${this.latlng.lat}&lon=${this.latlng.lng}&format=json`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(data.address.village);
        L.tooltip([this.latlng.lat, this.latlng.lng], {
          content: data.address.village,
        }).addTo(this.map);
        this.display_name.set(data.display_name);
      });
  }
  constructor(private loadingController: LoadingController) {
    effect(() => {
    const pos = this.GeolocationService.movingPosition();
    if (pos && this.map) {
      const startLatLng = L.latLng(this.latlng.lat, this.latlng.lng); // fixed current position
      const movingLatLng = L.latLng(pos.lat, pos.lng);

      // Add or update moving marker
      if (!this.lastMarker) {
        this.lastMarker = L.circleMarker([pos.lat, pos.lng], {
          radius: 5,
          color: 'blue',
        }).addTo(this.map);
      } else {
        this.lastMarker.setLatLng([pos.lat, pos.lng]);
      }

      // Calculate distance
      const distance = startLatLng.distanceTo(movingLatLng); // meters

      this.distanceFromStart.set(distance)

      // Add or update polyline
      if (!this.distanceLine) {
        this.distanceLine = L.polyline([startLatLng, movingLatLng], {
          color: 'green',
        }).addTo(this.map);

        // Add a tooltip showing distance
        this.distanceLine.bindTooltip(`${distance.toFixed(2)} m`, {
          permanent: true,
          direction: 'center',
          className: 'distance-tooltip',
        }).openTooltip();
      } else {
        this.distanceLine.setLatLngs([startLatLng, movingLatLng]);
        // Update tooltip content
        const tooltip = this.distanceLine.getTooltip();
        if (tooltip) {
          tooltip.setContent(`${distance.toFixed(2)} m`);
        }
      }

      // Optional: pan map to moving marker
      this.map.panTo([pos.lat, pos.lng]);
    }
  });
  }

  async showLoading() {
    this.loader = await this.loadingController.create({
      message: 'Please wait',
    });

    await this.loader.present();
  }

  async hideLoading() {
    if (this.loader) {
      await this.loader.dismiss();
      this.loader = undefined;
    }
  }

  ngAfterViewInit() {}

  showMap() {
    this.showLoading();
    this.getCurrentLocation();
    this.isMapVisible = true;
  }

  async startTracking() {
    await this.GeolocationService.watchPosition();
    this.trackingIndicator = 'Tracking'
  }
}
