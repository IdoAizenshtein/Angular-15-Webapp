import { Component } from '@angular/core';

@Component({
  template:
    '<div class="loader" style="flex-direction: column-reverse;">' +
    '<div style="margin-top: 20px;"><img style="height: auto; width: auto; position: relative;" fill ngSrc="/assets/images/logo2.png" alt="bizibox"></div>' +
    '<div><div class="circle"></div></div></div>'
})
export class NavigatePageComponent {}
