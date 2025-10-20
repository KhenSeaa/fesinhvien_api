import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        console.log('Adding auth header with token:', token.substring(0, 20) + '...');
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    } else {
        console.log('No auth token found for request:', req.url);
    }
    return next(req);
};


