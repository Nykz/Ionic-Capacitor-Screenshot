import { Component } from '@angular/core';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadBytes } from '@angular/fire/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Screenshot } from 'capacitor-screenshot';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  image: any;

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private toastController: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async takeScreenshot() {
    try {
      const image = await Screenshot.take();
      console.log(image.base64);
      await this.showLoading();
      this.image = 'data:image/png;base64,' + image.base64;
      const blob = this.base64toBlob(image.base64);
      const url = await this.uploadImage(blob, 'png');
      console.log('screenshot url: ', url);
      const response = await this.addDocument('screenshot', { imageUrl: url });
      console.log(response);
      await this.loadingCtrl.dismiss();
      await this.presentToast();
    } catch(e) {
      console.log(e);
      await this.loadingCtrl.dismiss();
    }
  }

  async takePicture() {
    try {
      if(Capacitor.getPlatform() != 'web') await Camera.requestPermissions();
      const image = await Camera.getPhoto({
        quality: 90,
        // allowEditing: false,
        source: CameraSource.Prompt,
        width: 600,
        resultType: CameraResultType.DataUrl
      });
      console.log('image: ', image);
      this.image = image.dataUrl;
      await this.showLoading();
      const blob = this.dataURLtoBlob(image.dataUrl);
      const url = await this.uploadImage(blob, image.format);
      console.log(url);
      const response = await this.addDocument('test', { imageUrl: url });
      console.log(response);
      await this.loadingCtrl.dismiss();
      await this.presentToast();
    } catch(e) {
      console.log(e);
      await this.loadingCtrl.dismiss();
    }
  }

  dataURLtoBlob(dataurl: any) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  async uploadImage(blob: any, format: any) {
    try {
      const currentDate = Date.now();
      const filePath = `test/${currentDate}.${format}`;
      const fileRef = ref(this.storage, filePath);
      const task = await uploadBytes(fileRef, blob);
      console.log('task: ', task);
      const url = getDownloadURL(fileRef);
      return url;
    } catch(e) {
      throw(e);
    }    
  }

  addDocument(path: any, data: any) {
    const dataRef = collection(this.firestore, path);
    return addDoc(dataRef, data);
  }


  base64toBlob(base64String: string) {
    let b64Data = base64String;
    console.log(b64Data);
    let contentType = '';
    let sliceSize = 512;

    b64Data = b64Data.replace(/data\:image\/(jpeg|jpg|png)\;base64\,/gi, '');

    let byteCharacters = atob(b64Data);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);

      let byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      let byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    // let blob = new Blob(byteArrays, { type: contentType });
    // let blob = new Blob(byteArrays, { type: `image/${b64DataObject.format}` });
    let blob = new Blob(byteArrays, { type: `image/png` });
    return blob;
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Image Upload Successfully',
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Loading...',
      // duration: 3000,
      spinner: 'circles'
    });

    loading.present();
  }

}
