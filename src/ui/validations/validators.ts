import departamentsValidationSchema from "./departaments.validators";
import proccessValidationSchema from "./proccess.validators";
import usersImageValidationSchema from "./users.image.validators";
import usersValidationSchema from "./users.validators";

export const useValidators = () => {
   const usersValidator = usersValidationSchema;
   const departamentsValidator = departamentsValidationSchema;
      const proccessValidator = proccessValidationSchema;
      const usersImageValidator = usersImageValidationSchema;

   return { usersValidator, departamentsValidator, proccessValidator, usersImageValidator };
};
