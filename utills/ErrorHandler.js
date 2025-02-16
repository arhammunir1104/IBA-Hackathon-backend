class ErrorHandler extends Error{
    statusCode
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor.name);
    }
};

export default ErrorHandler;

