import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DemoModeService } from './demo-mode.service';

describe('DemoModeService', () => {
  let service: DemoModeService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sessionStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        DemoModeService,
        { provide: Router, useValue: routerSpy },
      ],
    });
    service = TestBed.inject(DemoModeService);
  });

  it('starts with isDemo false when sessionStorage is empty', () => {
    expect(service.isDemo).toBeFalse();
  });

  it('restores isDemo true from sessionStorage on construction', () => {
    sessionStorage.setItem('fmf_demo', 'true');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DemoModeService, { provide: Router, useValue: routerSpy }],
    });
    const s2 = TestBed.inject(DemoModeService);
    expect(s2.isDemo).toBeTrue();
  });

  it('enter() sets isDemo true, persists to sessionStorage, navigates to /dashboard', () => {
    service.enter();
    expect(service.isDemo).toBeTrue();
    expect(sessionStorage.getItem('fmf_demo')).toBe('true');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('exit() clears isDemo, removes from sessionStorage, navigates to /auth/login', () => {
    service.enter();
    routerSpy.navigate.calls.reset();
    service.exit();
    expect(service.isDemo).toBeFalse();
    expect(sessionStorage.getItem('fmf_demo')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
