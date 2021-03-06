interface FormData {
  entries(): Iterator<[USVString, USVString | Blob]>;
}

interface FileReaderEventTarget extends EventTarget {
  result: string;
}

interface FileReaderEvent extends Event {
  target: FileReaderEventTarget;
}

interface Product {
  name: string;
  description: string;
}

interface Error {
  status: string;
  message: string;
}

import { Component, OnInit } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Router } from '@angular/router';
import { SplitPipe } from 'angular-pipes';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../../services/data.service';
import { LayoutService } from '../../services/layout.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

declare var jquery: any;
declare var $: any;


@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  backgroundColor: string;
  headlineColor: string;
  warningColor: string;
  successColor: string;
  navbarColor: string;
  teaserColor: string;
  buttonColor: string;
  errorColor: string;
  alertColor: string;
  infoColor: string;
  linkColor: string;
  textColor: string;

  url: string;
  limit: number;
  page: number;
  userId: string;
  userConfirmed: boolean;
  headers: Headers;
  product: Product;
  editField: string;
  selectedFile: any = [];
  loading: boolean;
  userToken: string;
  description: string;
  name: string;
  error: any = {};
  modalId = 'product-error';
  errorName: string;
  currencies: string[];
  products: any = [];
  productCategories: string[];
  productConditions: string[];

  constructor(private fb: FormBuilder,
    private http: Http,
    private layout: LayoutService,
    private router: Router,
    private data: DataService) {
    this.data.changeIsPublicPage(false);
    this.data.currentUserId.subscribe(userId => this.userId = userId);
    this.data.currentUserToken.subscribe(userToken => this.userToken = userToken);
    this.data.currentUserConfirmed.subscribe(userConfirmed => this.userConfirmed = userConfirmed);

    this.layout.currentBackgroundColor.subscribe(backgroundColor => this.backgroundColor = backgroundColor);
    this.layout.currentHeadlineColor.subscribe(headlineColor => this.headlineColor = headlineColor);
    this.layout.currentWarningColor.subscribe(warningColor => this.warningColor = warningColor);
    this.layout.currentSuccessColor.subscribe(successColor => this.successColor = successColor);
    this.layout.currentNavbarColor.subscribe(navbarColor => this.navbarColor = navbarColor);
    this.layout.currentTeaserColor.subscribe(teaserColor => this.teaserColor = teaserColor);
    this.layout.currentButtonColor.subscribe(buttonColor => this.buttonColor = buttonColor);
    this.layout.currentAlertColor.subscribe(alertColor => this.alertColor = alertColor);
    this.layout.currentErrorColor.subscribe(errorColor => this.errorColor = errorColor);
    this.layout.currentTextColor.subscribe(textColor => this.textColor = textColor);
    this.layout.currentInfoColor.subscribe(infoColor => this.infoColor = infoColor);
    this.layout.currentLinkColor.subscribe(linkColor => this.linkColor = linkColor);

    this.url = environment.apiUrl;
    this.headers = new Headers({
      'content-type': 'application/json'
    });
  }

  ngOnInit() {
    this.limit = -1;
    this.page = 1;
    this.loading = true;

    this.getAllProductCategories();
    this.getAllProductsByUser();
    this.getAllConditions();
    this.getAllCurrencies();
  }

  /**
   * By Ken Fyrstenberg Nilsen
   *
   * drawImageProp(context, image [, x, y, width, height [,offsetX, offsetY]])
   *
   * If image and context are only arguments rectangle will equal canvas
  */
  drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
    if (arguments.length === 2) {
      x = y = 0;
      w = ctx.canvas.width;
      h = ctx.canvas.height;
    }

    /// default offset is center
    offsetX = typeof offsetX === 'number' ? offsetX : 0.5;
    offsetY = typeof offsetY === 'number' ? offsetY : 0.5;

    /// keep bounds [0.0, 1.0]
    if (offsetX < 0) {
      offsetX = 0;
    }

    if (offsetY < 0) {
      offsetY = 0;
    }

    if (offsetX > 1) {
      offsetX = 1;
    }

    if (offsetY > 1) {
      offsetY = 1;
    }

    const iw = img.width;
    const ih = img.height;
    const r = Math.min(w / iw, h / ih);
    let nw = iw * r;  /// new prop. width
    let nh = ih * r;  /// new prop. height
    let cx, cy, cw, ch, ar = 1;

    /// decide which gap to fill
    if (nw < w) {
      ar = w / nw;
    }

    if (nh < h) {
      ar = h / nh;
    }

    nw *= ar;
    nh *= ar;

    /// calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    /// make sure source rectangle is valid
    if (cx < 0) {
      cx = 0;
    }

    if (cy < 0) {
      cy = 0;
    }

    if (cw > iw) {
      cw = iw;
    }

    if (ch > ih) {
      ch = ih;
    }

    /// fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
  }


  onFileSelected(event, productId) {
    const self = this;
    for (const file of event.target.files) {
      if (file) {
        const reader = new FileReader();

        reader.onload = function(e: FileReaderEvent) {
          const canvas = <HTMLCanvasElement>document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image;

          img.onload = draw;

          function draw() {
            self.drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height, 0.5, 0.5);

            const dataUrl = canvas.toDataURL();
            canvas.toBlob(function(blob) {
              const form = new FormData();
              let headers: Headers;
              let url: string;

              form.append('image', blob, 'moody.jpg');
              form.append('product_id', productId);
              url = `${self.url}/api/image`;

              headers = new Headers({
                'Authorization': `Bearer ${self.userToken}`
              });

              self.http.put(url, form, { headers: headers })
                .toPromise()
                .then(res => {
                  const imageId = res.json().id;
                  const selectorId = 'thumbnail-' + productId;
                  const wrapperDiv = document.createElement('div');
                  wrapperDiv.setAttribute('class', 'pos-relative margin-top-12 margin-left-12');

                  const imageElement = document.createElement('img');
                  imageElement.setAttribute('src', dataUrl);
                  imageElement.setAttribute('width', '100%');
                  imageElement.setAttribute('height', 'auto');
                  imageElement.setAttribute('id', 'image-' + imageId);

                  const buttonElement = document.createElement('button');
                  const buttonClass = 'pos-absolute pos-right-12 pos-top-12 btn btn-danger btn-xs glyphicon glyphicon-trash';
                  buttonElement.setAttribute('class', buttonClass);
                  buttonElement.addEventListener('click', function() {
                    self.removeImageById(imageId);
                  });

                  const documentFragment = document.createDocumentFragment();
                  documentFragment.appendChild(wrapperDiv);
                  wrapperDiv.appendChild(imageElement);
                  wrapperDiv.appendChild(buttonElement);
                  document.getElementById(selectorId).appendChild(documentFragment);
                })
                .catch(err => {
                  // **
                });
            });
          }
          img.src = e.target.result;
        };

        reader.readAsDataURL(file);
      }
    }
  }


  showUpdateForm(productId) {
    if (!this.editField || this.editField !== productId) {
      this.editField = productId;
    } else {
      this.editField = '';
    }
  }

  getAllCurrencies() {
    this.http.get(`${this.url}/api/currencies`).subscribe(res => {
      // console.log(res.json());
      this.currencies = res.json().currencies;
    });
  }

  updateEntry(product) {
    this.updateOneProductById(product, this.userToken)
      .then((res) => {
        // console.log(res.json());
      })
      .catch((err) => {
        // console.log(err.json());
        this.error = err.json();
        $('#' + this.modalId).modal();
      });
  }

  updateOneProductById(product, userToken) {
    let url: string;
    let headers: Headers;

    url = `${this.url}/api/product/${product.id}`;
    headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    });

    console.log(product);
    return this.http.put(url, product, { headers: headers }).toPromise();
  }

  removeProductById(productId) {
    this.deleteProduct(this.userToken, productId)
      .then((product) => {
        // console.log(product.json());
        for (let i = 0; i < this.products.length; i++) {
          if (this.products[i]['id'] === productId) {
            this.products.splice(i, 1);
          }
        }
      })
      .catch((err) => {
        // console.log(err.json());
        this.error = err.json();
        $('#' + this.modalId).modal();
      });
  }

  getAllImagesById(productId) {
    let url: string;
    let headers: Headers;

    url = `${this.url}/api/image/product/${productId}`;
    headers = new Headers({
      'Content-Type': 'application/json'
    });

    return this.http.get(url, { headers: headers }).toPromise();
  }

  getAllProductsByUser() {
    this.loadProducts(this.userToken)
      .then((products) => {
        // console.log(products.json().products);
        this.products = products.json().products;
        this.loading = false;

        for (let i = 0; i < this.products.length; i++) {
          this.products[i].image = '';
          this.getAllImagesById(this.products[i].id)
            .then(res => {
              this.products[i].image = res.json().images;
            })
            .catch(err => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  loadProducts(userToken) {
    let url: string;
    let headers: Headers;

    url = `${this.url}/api/product/user/${this.userId}`;
    headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    });

    return this.http.get(url, { headers: headers }).toPromise();
  }

  getAllProductCategories() {
    this.loadAllProductCategories(this.userToken, -1, 1)
      .then((productCategories) => {
        // console.log(productCategories.json());
        this.productCategories = productCategories.json()['product-categories'];
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getAllConditions() {
    this.http.get(`${this.url}/api/conditions`).subscribe(res => {
      // console.log(res.json().conditions);
      this.productConditions = res.json().conditions;
    });
  }

  loadAllProductCategories(userToken, limit, page) {
    let url: string;
    let headers: Headers;
    const params = new URLSearchParams();

    url = `${this.url}/api/product-categories`;
    headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    });

    params.append('limit', limit);
    params.append('page', page);

    return this.http.get(url, { params: params, headers: headers }).toPromise();
  }

  deleteProduct(userToken, productId) {
    let url: string;
    let headers: Headers;

    url = `${this.url}/api/product/${productId}`;
    headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    });

    return this.http.delete(url, { headers: headers }).toPromise();
  }

  removeImageById(imageId) {
    let url: string;
    let headers: Headers;

    url = `${this.url}/api/image/${imageId}`;
    headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.userToken}`
    });

    return this.http.delete(url, { headers: headers })
      .toPromise()
      .then(res => {
        // console.log(res.json());
        const imageElement = <any>document.getElementById('image-' + imageId);
        imageElement.parentNode.remove();
      })
      .catch(err => {
        // console.log(err.json());
        this.error = err.json();
        $('#' + this.modalId).modal();
      });
  }

}
