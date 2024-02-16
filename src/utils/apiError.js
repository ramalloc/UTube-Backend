class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong !", // this message doesn't gives any reference of any error thereore we write some by default msg.
        errors = [], // If there are multiple errors.
        stack = "", // Error stack, if it is not present then we will keep it empty.
    ){
        // now we will overwrite the constructor
        // Whenever we overwrite the constructor we call {super()}, we give {message} as argument in super(message) means we want to 
        // overwrite message
        super(message)

        // We can also add some fields and overwrite them using this.
        this.statusCode = statusCode
        this.data  = null
        this.message = message
        this.success = false
        this.errors = errors

        // Stack trace gives the errors details like in which file , code or line. Stack trace consist these details  
        if(stack){
            this.stack = stack
        }
        // If we don't have stack we will pass the reference of instance in stackTrace
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}