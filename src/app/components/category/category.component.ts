import { Component, OnInit } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  rForm: FormGroup;
  url: string;
  query: string;
  error: Error;
  productCategories: any = [];

  constructor(private fb: FormBuilder, private router: Router, private http: Http) {
    this.url = environment.apiUrl;
    this.rForm = fb.group({
      'category': [null, Validators.required]
    });
    this.getProductCategories();
  }

  ngOnInit() {   }

  category(id) {
    this.router.navigateByUrl(`/category/${id.category}`);
  }

  getProductCategories() {
    this.loadProductCategories()
      .then((productCategories) => {
        // console.log(productCategories.json());
        this.productCategories = productCategories.json()['product-categories'];
      })
      .catch((err) => {
        console.log(err.json());
        this.error = err.json();
      });
  }

  loadProductCategories() {
    let url: string;
    let headers: Headers;

    url = `${this.url}/product-categories`;
    headers = new Headers({ 'Content-Type': 'application/json' });

    return this.http.get(url, { headers: headers }).toPromise();
  }

}

interface Error {
  status: string;
  message: string;
}
