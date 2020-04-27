import { Actions, ofType, Effect } from '@ngrx/effects';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import * as AuthActions from './auth.action';
import { User } from '../user.model';
import { AuthService } from '../auth.service';

export interface AuthResponseData {
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: boolean;
}

const handleAuthetication = (
    email: string,
    localId: string,
    token: string,
    expiresIn: number
) => {
    const expDate = new Date(new Date().getTime() +  expiresIn * 1000);
    const newUser = new User(email, localId, token, expDate);
    localStorage.setItem('userData', JSON.stringify(newUser));
    return new AuthActions.AuthenticationSuccess({
        email: email,
        userId: localId,
        token: token,
        expirationDate: expDate,
        redirect: true
    });
};

const handleError = (errorResponse: any) => {
    let errorMessage = 'An unknown error occured !';
    if (!errorResponse.error || !errorResponse.error.error) {
        return of(new AuthActions.AuthenticationFail(errorMessage));
    }
    switch (errorResponse.error.error.message) {
        case 'EMAIL_NOT_FOUND': errorMessage = 'This email not found !!'; break;
        case 'INVALID_PASSWORD': errorMessage = 'Invalid Password, Please try again !!'; break;
        case 'USER_DISABLED': errorMessage = 'This email is disabled by admin !!'; break;
        case 'EMAIL_EXISTS': errorMessage = 'This email already exist !!'; break;
        case 'OPERATION_NOT_ALLOWED': errorMessage = 'This operation is not allowed!!'; break;
        case 'TOO_MANY_ATTEMPTS_TRY_LATER': errorMessage = 'Too many attempts! Try again later!!';
    }
    return of(new AuthActions.AuthenticationFail(errorMessage));
};

@Injectable()
export class AuthEffects {


    @Effect()
    authSignup = this.actions$.pipe(
        ofType(AuthActions.SIGNUP_START),
        switchMap((authSignUpState: AuthActions.SignupStart) => {
            return this.http.post<AuthResponseData>('/signupapi', {
                email: authSignUpState.payload.email,
                password: authSignUpState.payload.password,
                returnSecureToken: true
            }).pipe(
                tap(respData => {
                    this.authService.setLogTimer(+respData.expiresIn * 1000);
                }),
                map(resData => {
                    return handleAuthetication(resData.email, resData.localId, resData.idToken, +resData.expiresIn);
                }),
                catchError(errorResponse => {
                    return handleError(errorResponse);
                })
            );
        })
    );


    @Effect()
    authLogin = this.actions$.pipe(
        ofType(AuthActions.LOGIN_START),
        switchMap((authState: AuthActions.LoginStart) => {
            return this.http.post<AuthResponseData>('/loginapi', {
                email: authState.payload.email,
                password: authState.payload.password,
                returnSecureToken: true
            }).pipe(
                tap(respData => {
                    this.authService.setLogTimer(+respData.expiresIn * 1000);
                }),
                map(resData => {
                    return handleAuthetication(resData.email, resData.localId, resData.idToken, +resData.expiresIn);
                }),
                // we Cretw a pipe here as we cannot maintain it in upper level necause in case error response
                // it will the action$ observable and then we will not able to login again, this is also helpful
                // in case of depatch the next action after the side effect is handled
                catchError(errorResponse => {
                    // of is used to create a non error observable
                    return handleError(errorResponse);
                })
            );
        })
    );

    @Effect({dispatch: false})
    authRedirect = this.actions$.pipe(
        ofType(AuthActions.AUTHENTICATION_SUCCESS),
        tap((authState: AuthActions.AuthenticationSuccess) => {
            if (authState.payload.redirect) {
                this.router.navigate(['/']);
            }
        })
    );

    @Effect({dispatch: false})
    authLogout = this.actions$.pipe(
        ofType(AuthActions.LOGOUT),
        tap(() => {
            this.router.navigate(['/auth']);
            localStorage.removeItem('userData');
            this.authService.clearLogoutTimer();
        })
    );

    @Effect()
    autoLogin = this.actions$.pipe(
        ofType(AuthActions.AUTO_LOGIN),
        map(() => {
            const userData: {
                email: string;
                id: string;
                _token: string;
                _tokenExpirationDate: string;
            } = JSON.parse(localStorage.getItem('userData'));
            if (!userData) {
                return { type: 'DUMMY' };
            }
            const loggedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate));
            if (loggedUser.token) {
                const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
                this.authService.setLogTimer(expirationDuration);
                return new AuthActions.AuthenticationSuccess({
                    email: loggedUser.email,
                    userId: loggedUser.id,
                    token: loggedUser.token,
                    expirationDate: new Date(userData._tokenExpirationDate),
                    redirect: false
                });
            }
            return { type: 'DUMMY' };
        })
    );

    constructor(private actions$: Actions, private http: HttpClient, private router: Router, private authService: AuthService) {}
}
