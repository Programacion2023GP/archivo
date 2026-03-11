import departamentsValidationSchema from "./departaments.validators";
import proccessValidationSchema from "./proccess.validators";
import usersValidationSchema from "./users.validators";

export const useValidators = () => {
   const usersValidator = usersValidationSchema;
   const departamentsValidator = departamentsValidationSchema;
      const proccessValidator = proccessValidationSchema;
   return { usersValidator, departamentsValidator, proccessValidator };
};
