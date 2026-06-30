// src/app/shared/layout/shell/shell.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { ProfileService } from '../../../core/profile.service';
import { DemoModeService } from '../../../core/demo-mode.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  template: `
    <div class="shell">
      <div class="nav-sidebar">
        <app-nav mode="sidebar" />
      </div>
      <main class="shell-content">
        <router-outlet />
      </main>
      <div class="nav-bottom">
        <app-nav mode="bottom" />
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private demoMode = inject(DemoModeService);

  async ngOnInit() {
    if (this.demoMode.isDemo) return;
    try {
      const profile = await this.profileService.getProfile();
      if (!profile.onboarding_completed) {
        this.router.navigate(['/onboarding']);
      }
    } catch {
      // Profile not yet available — auth state may still be settling
    }
  }
}
