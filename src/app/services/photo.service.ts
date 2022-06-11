import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})

export class PhotoService {

  public photos: UserPhoto[] = [];

  private PHOTO_STORAGE: string = 'photos';

  constructor() { }

  public async addNewToGallery() {

    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    const savedImageFile = await this.savePicture(capturedPhoto);

    this.photos.unshift(savedImageFile);

    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

  }

  public async loadSavedPhotos() {

    const photoList = await Storage.get({
      key: this.PHOTO_STORAGE
    });

    this.photos = JSON.parse(photoList.value) || [];


    for (let photo of this.photos) {

      const readFile = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data
      });


      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }

  private async savePicture(photo: Photo) {

    const base64Data = await this.readAsBase64(photo);

    const fileName = new Date().getTime() + '.jpg';

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filepath: fileName,
      webviewPath: photo.webPath
    };

  }

  private async readAsBase64(photo: Photo) {

    const blob = await (await fetch(photo.webPath)).blob();

    return await this.blob2Base64(blob) as string;

  }

  private blob2Base64 = (blob: Blob) => new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onerror = reject;

    reader.onload = () => {

      resolve(reader.result);

    };

    reader.readAsDataURL(blob);

  }

  );

}

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}
