import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { AuthService } from './core/auth.service';
import { ProfileService } from './core/profile.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  private translate = inject(TranslateService);
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);

  ngOnInit() {
    this.translate.setDefaultLang('it');
    this.auth.session$
      .pipe(
        filter(Boolean),
        switchMap(() => this.profileService.getProfile$())
      )
      .subscribe(profile => {
        this.translate.use(profile.language);
      });
  }
}
