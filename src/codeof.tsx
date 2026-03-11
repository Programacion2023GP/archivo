//   import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState, type ChangeEvent, type EventHandler, type InputEventHandler } from "react";
// import type { JSX } from "react/jsx-runtime";

// type Form<T extends object> = {
//   initialValues: T
//   renderProps: (formik: formik<T>) => React.ReactNode
// }
// type formik<T extends object>  = {  
//   values: T
// }


// interface Users {
//   name: string,
//   city: string,
//   address: string,
//   phone: string,
// }

// function App() {
//   const formRef = useRef<FormRef<Users>>(null)
//   return (
//     <>
//       <CustomForm<Users> ref={formRef}  initialValues={{name:"",address:"",city:"",phone:""}} renderProps={({values}) => (<>
//         <CustomInput<Users> name={"name"} label="ingresa el nombre" onChange={(e)=>formRef.current?.setValue("name",e)}/>
//         <CustomInput<Users> name={"city"} label="ingresa la ciudad" onChange={(e)=>formRef.current?.setValue("city",e)}/>
//         <CustomInput<Users> name={"address"} label="ingresa la dirrecion" onChange={(e)=>formRef.current?.setValue("address",e)}/>
//         <CustomInput<Users> name={"phone"} label="ingresa el numero" onChange={(e)=>formRef.current?.setValue("phone",e)}/>

//       </>)} />
//       <button className="hover:cursor-pointer" onClick={()=>{
//         formRef.current?.getValues()
//       }}>click me</button>
//         <button className="hover:cursor-pointer" onClick={()=>{
//         formRef.current?.resetForm()
//       }}>reseteo</button>
//     </>
//   );
// }

// type FormRef<T extends object>= {
// getValues :()=>void,
//   setValue: <K extends keyof T>(name: K, val: T[K]) => void;
// resetForm :()=>void,
// }

// const CustomForm = forwardRef(
//   <T extends object>({ initialValues, renderProps }: Form<T>, ref: React.Ref<FormRef<T>>) => {
//     const [values,setValues] = useState<T>(initialValues);
//     useImperativeHandle(ref,()=>({
//       getValues :()=>console.log(values),
//        setValue: <K extends keyof T>(name: K, val: T[K]) => {
//         setValues((prev) => ({
//           ...prev,
//           [name]: val
//         }));
//       },
//       resetForm:()=>{
//         setValues(initialValues)
//       }
      
//     }),[values])
//     return (
//       <form className="container shadow rounded-2xl p-6 ">
//         {renderProps({values:values,})}
//       </form>
//     );
//   }
// ) as <T extends object>(
//    props: Form<T> & { ref?: React.Ref<FormRef<T>> }
//  ) => JSX.Element;













// type InputProps<T extends object> = {
//   label:string
//   name: keyof T;          // clave de T
//   value?: T[keyof T];     // valor de la clave
//   onChange: (value: keyof T) => void;
// };

// const CustomInput = <T extends object>({ name, value, label, onChange }: InputProps<T>) => {
//   return (
//     <input
//       className="border border-2 w-full rounded-2xl my-2"
//       type="text"
//       name={name.toString()}
//       value={value as string} // si sabes que es string
//       onChange={(e) => onChange(e.target.value as keyof T)}
//     />
//   );
// };


// export default App
