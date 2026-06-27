// src/app/core/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { Session } from '@supabase/supabase-js';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session$.pipe(
    filter((s): s is Session | null => s !== undefined),
    take(1),
    map(session => (session ? true : router.createUrlTree(['/auth/login'])))
  );
};
