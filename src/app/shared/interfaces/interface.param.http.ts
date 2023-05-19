export interface InterfaceParamHttp<T> {
    method: string;
    path?: string;
    params?: any;
    isJson?: boolean;
    isProtected?: boolean;
    isAuthorization?: boolean;
    isAuthorizationToken?: string;
    // isBlob?: boolean;
    responseType?: string;
    isHeaderAuth?: any;
    isFormData?: boolean;
    stopRedInError?: boolean;
}

export interface Params {
    method: string;
    url: string;
    options?: any;
}

export interface UserAuth {
    formUser: {
        username: string;
        password: string;
        rememberMe?: boolean;
        gRecaptcha:any
    };
}
