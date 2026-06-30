import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DemoModeService {
  private router = inject(Router);

  isDemo = sessionStorage.getItem('fmf_demo') === 'true';

  enter(): void {
    this.isDemo = true;
    sessionStorage.setItem('fmf_demo', 'true');
    this.router.navigate(['/dashboard']);
  }

  exit(): void {
    this.isDemo = false;
    sessionStorage.removeItem('fmf_demo');
    this.router.navigate(['/auth/login']);
  }
}
