import multer from "multer"

// It is saving the file on local server and returning the path and name of file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

export const upload = multer(
    { storage: storage }
);
