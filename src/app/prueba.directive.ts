import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appPrueba]',
  standalone: true
})
export class PruebaDirective {

  @Input() appPrueba: string | undefined;
  constructor(private el: ElementRef) { }

  ngOnInit() {
    this.el.nativeElement.style.backgroundColor = this.appPrueba||'yellow';
  }

}
