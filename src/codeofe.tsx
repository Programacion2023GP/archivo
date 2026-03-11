// import type { FiltersList, ModelList } from "./ui/models/list.model"
// import React, { memo, useCallback, useEffect, useMemo, useState, type ChangeEvent, type ChangeEventHandler } from "react";

// type Pago =
//   | { tipo: "Efectivo"; monto: number }
//   | { tipo: "Tarjeta"; numero: string; monto: number }
//   | { tipo: "Transferencia"; banco: string; monto: number }


// const item:Pago = {
//   tipo:"Tarjeta",
//   monto:33,
//   numero:""
// }

// type Edades = Record<"Ana" | "Luis", number>;

// const edades: Edades = { Ana: 25, Luis: 30 };
// edades.Ana = 26;



// const firstAndFinalItem = <T,>(array: T[]): T[] => {

//   return [array[0], array[array.length - 1]];
// }

// const objectAndArray = <T, K extends keyof T = keyof T>(obj: T, array: K[]): Partial<T> => {
//   const item: Partial<T> = { ...obj };
//   Object.keys(item).map((it) => {
//     if (!array.includes(it as K)) {
//       delete item[it as K]
//     }
//   });
//   return item;
// }

// interface AppList {
// list: string[],

// }
// function App() {
//   const [list,setList] = useState<AppList>({list:[]})
//   const [text,setText] = useState<string>("");
//   const addItem =() => {
//     setList((prev)=>{
//     return {
//       list : [...prev.list,text]
//     }
//   })
//   setText("")
//   }
// return (
//   <>
//   <Input value={text} label="escribe algo" onChange={(e)=>setText(e.target.value)}/>
//    <TodoList<string> list={list.list}/>
//     <button className="bg-blue-400 w-fit h-20 rounded-4xl p-4" onClick={addItem}>Add</button>
//   </>
//   );
// }


// interface PropsList<T > {
//   list: T[],
// }

// const TodoList = <T,>({list}:PropsList<T >)=>{
//   return (<ul>
//     {list.map(it=>{
//       return (<li>{`${it}`}</li>)
//     })}

//   </ul>)
// }

// interface InputProps {
//   label :string,
//    value:string,
//   onChange :(event: ChangeEvent<HTMLInputElement>)=>void
//     // onChange: (event: ChangeEvent<HTMLInputElement>) => void;

// }

// const Input =memo(({label,onChange,value}:InputProps)=>{
//  return(
//   <input className="w-full h-10 rounded-2xl border-2" value={value} placeholder={label} onChange={onChange} />
//  )
// })



// interface ItemProps {
//   name: string;
//   onClick: () => void;
 
// }

// const ListItem = memo(({ name, onClick }: ItemProps) => {
//   console.log("Render ListItem:", name);
  
//   // Simula un render pesado
//   let sum = 0;
//   for (let i = 0; i < 10_000_000; i++) sum += i;
  
//   return (
//     <div style={{ margin: "4px 0" }}>
//       {name} <button onClick={onClick}>Click</button>
//     </div>
//   );
// });







// // const [count, setCount] = useState(0);

// //   const saludo = useCallback(()=>setCount((prev)=>prev +1),[]);
// //   return <CustomForm<User> initialValues={{Name:"cas",age:0,city:"ss"}} onClick ={saludo} renderProps={(user)=>{
// //     return (
// //       <>
// //       <p>{user.Name}</p>
// //       <p>{user.age}</p>
// //       <p>{user.city}</p>

// //       </>
// //     )
// //   }}/>
  
//   // useEffect(() => {
//   //   const user = {
//   //     name: "Carlos",
//   //     age: 22,
//   //     phone: 8789382390,
//   //     city: 'Torreon',
//   //     state: "Coahuila",
//   //     country: "Mexico",
//   //   }
//   //   objectAndArray(user, ['name', 'age', 'city']);
//   // }, [])

//   // return (<ListComponent array={["c", "d", "e"]} renderProps={(it) => <span>{it}</span>}></ListComponent>)







// // const ListComponent = <T,>({ array, renderProps }: PropsList<T>) => {
//   //   return (<ul>
//   //     {array.map((it) => {
//     //       return (
//       //         <li>
// //           {renderProps(it)}
// //         </li>
// //       )
// //     }
// //     )}
// //   </ul>);
// // }



// // interface PropsMultiple<T> extends PropsList<T> {
// //   arraym: T[],
// //   renderPropsm: (item: T) => React.ReactNode
// // }





// // const ListMultiple = <T,>({ array, renderProps, arraym, renderPropsm }: PropsMultiple<T>) => {
// //   return (
// //     <>
// //       <ul>
// //         {array.map((it) => {
// //           return (
// //             <li>
// //               {renderProps(it)}
// //             </li>
// //           )
// //         }
// //         )}
// //       </ul>
// //       <ul>
// //         {arraym.map((it) => {
// //           return (
// //             <li>
// //               {renderPropsm(it)}
// //             </li>
// //           )
// //         }
// //         )}
// //       </ul>
// //     </>)

// // }



//   type Prioridad = "Bajo" | "Medio" | "Alto"

// const prioridad = (prioridad: Prioridad)=>{
//   switch (prioridad) {
//     case "Alto":
      
//       break;
//    case "Medio":
      
//       break;
//        case "Bajo":
      
//       break;
//     default:
//       const _exhaustiveCheck: never = prioridad; // ⚠️ TypeScript marcará error: 'Amarillo' no es asignable a never
//       return _exhaustiveCheck;
//       break;
//   }
// }

// interface PropsForm<T extends object> {
//   initialValues: T;
//   renderProps: (props: T) => React.ReactNode;
//   onClick: ()=>void
// }


// const CustomFormComponent = <T extends object>({
//   initialValues,
//   renderProps,
//   onClick
// }: PropsForm<T>) => {
//   console.log("render como")
//   return (
//     <>
//       {renderProps(initialValues)}
//       <button
//         className="w-full h-20 rounded-2xl bg-yellow-400 cursor-pointer"
//         onClick={onClick}
//       >
//         Aqui click
//       </button>
//     </>
//   );
// };
// const CustomForm = memo(CustomFormComponent) as typeof CustomFormComponent;


// // interface User {
// //   name: string,
// //   age: number,
// //   active: boolean,

// // }
// // const firstItem =<T,>(array:T[]):T=>{
// //   return array[0];
// // }
// // const getValue=<T,K extends keyof T>(obj: T,key :K ):T[K]=>{
// //   return obj[key];
// // }

// // function App() {
// //   const users: User[] = [
// //     { name: "Pedro", age: 22, active: true },
// //     { name: "Ana", age: 28, active: false },
// //     { name: "Luis", age: 35, active: true },
// //     { name: "Carla", age: 19, active: true },
// //     { name: "Jorge", age: 42, active: false },
// //     { name: "Marta", age: 30, active: true },
// //     { name: "Sofía", age: 25, active: false },
// //     { name: "David", age: 33, active: true },
// //     { name: "Lucía", age: 27, active: true },
// //     { name: "Miguel", age: 40, active: false },
// //   ];
// //   const [filterUsers, setFilterUsers] = useState<User[]>(users);

// //   return (
// //     <>
// //       <button className="w-fit p-2 h-10 rounded-2xl shadow hover:cursor-pointer" onClick={() => {
// //         setFilterUsers(users.filter((u) => u.active == true))
// //       }}>Activos</button>
// //       <button className="w-fit p-2 h-10 rounded-2xl shadow hover:cursor-pointer" onClick={() => {
// //         setFilterUsers(users.filter((u) => u.active == false))
// //       }}>Inactivos</button>

// //       <FilterList list={filterUsers} renderItems={(i) => (<em>{i.name}</em>)}  filterKey="age" filterValue={22}/>
// //     </>
// //   )
// // }

// // interface Props<T, K extends keyof T = keyof T> {
// //   list: T[];
// //   renderItems: (item: T) => React.ReactNode;
// //   filterKey?: K;
// //   filterValue?: T[K];
// // }

// //  const FilterList = <T, K extends keyof T = keyof T>({
// //   list,
// //   renderItems,
// //   filterKey,
// //   filterValue,
// // }: Props<T, K>) => {
// //   // filtra solo si filterKey y filterValue existen
// //   const filteredList = filterKey && filterValue !== undefined
// //     ? list.filter(item => item[filterKey] === filterValue)
// //     : list;

// //   return (
// //     <ul>
// //       {filteredList.map((item, index) => (
// //         <li key={index}>{renderItems(item)}</li>
// //       ))}
// //     </ul>
// //   );
// // }





// // const Component =<T,>({names,numbers}:Props<T>) =>{
// //   return(<></>)
// // }







// // const UsuarioInfo: React.FC<User> = ({ active, age, name }) => {
// //   return (<>
// //     <span>Nombre    {name}</span>
// //     <span>EDAD    {age}</span>
// //     <span>Activo    {active ? 'Activo' : 'Inactivo'}</span>


// //   </>)
// // }
// // interface ListProps<T> {
// //   items: T[];
// //   renderItem: (item: T) => React.ReactNode;
// // }

// // function ListaGenerica<T>({ items, renderItem }: ListProps<T>) {
// //   return <ul>{items.map(renderItem)}</ul>;
// // }

// // // Uso:
// // const numeros = [1, 2, 3];
// // const nombres = ["Ana", "Luis", "Carlos"];


// // type Color2 = "Rojo" | "Verde" | "Azul" | "Amarillo";
// // const pintar2 = (color: Color2) => {
// //   switch(color) {
// //     case "Rojo": return "🔴";
// //     case "Verde": return "🟢";
// //     case "Azul": return "🔵";
// //     default:
// //       const _exhaustiveCheck: never = color; // ⚠️ TypeScript marcará error: 'Amarillo' no es asignable a never
// //       return _exhaustiveCheck;
// //   }
// // };

// // type Membresia = 'Premiun'|'Socio'|'VIP'
// // interface PropsComponent {
// //   name:string,
// //   age:number,
// //   mebresia:Membresia
// //   active?:boolean,

// // }

// // const Practica:React.FC<PropsComponent> =({name,active=true,age,mebresia})=>{
// //   return(
// //     <>
// //     <span>{name}</span>
// //     <span>{age}</span>
// //     <span>{active ? 'Activo':"Inactivo"}</span>
// //     <span>{mebresia}</span>
// //     </>
// //   )
// // }
// export default App
