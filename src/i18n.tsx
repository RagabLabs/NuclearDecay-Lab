import { createContext, useContext, useEffect, useState, Children, cloneElement, isValidElement, type ReactNode } from 'react';
import { AR } from './translations';
export type Language='en'|'ar';
const Context=createContext({language:'en' as Language,setLanguage:(_language:Language)=>{}});
export function translate(text:string,language:Language):string {
  if(language==='en')return text;
  const clean=text.trim();
  const value=AR[clean];
  if(value)return text.replace(clean,value);
  if(/^[\d\s.,+eE%×^−–−±()\/]*$/.test(clean)||clean==='')return text;
  // Dynamic labels and validation strings retain the numerical content and unit symbols.
  const patterns:[RegExp,(...match:string[])=>string][]=[
    [/^(.+) must be a finite number\.$/,(_,name)=>`${translate(name,language)} يجب أن يكون رقمًا محدودًا.`],
    [/^(.+) must be greater than zero\.$/,(_,name)=>`${translate(name,language)} يجب أن يكون أكبر من صفر.`],
    [/^(.+) cannot be negative\.$/,(_,name)=>`${translate(name,language)} لا يمكن أن يكون سالبًا.`],
    [/^(.+): enter a number, for example 12.5 or 1.2e6\.$/,(_,name)=>`${translate(name,language)}: أدخل رقمًا مثل 12.5 أو 1.2e6.`],
    [/^(.+) exceeds the browser's numerical range\.$/,(_,name)=>`${translate(name,language)} يتجاوز المجال العددي للمتصفح.`],
    [/^(.+) is below the browser's numerical range\.$/,(_,name)=>`${translate(name,language)} أقل من المجال العددي للمتصفح.`],
    [/^(.+) is smaller than the browser can represent\. Use a different unit or value\.$/,(_,name)=>`${translate(name,language)} أصغر من المجال الذي يمثله المتصفح؛ اختر قيمة أو وحدة أخرى.`],
    [/^([A-Za-z -]+) \(([^)]+)\)$/,(_,label,unit)=>`${translate(label,language)} (${unit})`],
    [/^(.+) unit$/,(_,label)=>`وحدة ${translate(label,language)}`],
    [/^Time (\d+)$/,(_,index)=>`الزمن ${index}`],
    [/^(\d+) calculated time points · full precision in CSV$/,(_,n)=>`${n} نقطة زمنية محسوبة · دقة كاملة في CSV`],
    [/^(.+) initial activity$/,(_,name)=>`النشاط الابتدائي لـ ${name}`],
    [/^After (.+)$/,(_,v)=>`بعد ${v}`],
    [/^Time in (.+)$/,(_,v)=>`الزمن بوحدة ${translate(v,language)}`],
    [/^after (.+)$/,(_,v)=>`بعد ${v}`],
    [/^(.+) half-lives elapsed$/,(_,n)=>`مرّ ${n} من أنصاف الأعمار`],
    [/^(.+) conversion exceeds the floating-point range\. Choose a different value or unit\.$/,(_,q)=>`تحويل ${translate(q,language)} يتجاوز المجال العددي. اختر قيمة أو وحدة أخرى.`],
    [/^Input λ is in (.+) \(per (.+)\)\.$/,(_,u,v)=>`ثابت التحلل المدخل بوحدة ${u}⁻¹ (لكل ${translate(v,language)}).`],
  ];
  for(const [pattern,replace] of patterns){const match=clean.match(pattern);if(match)return replace(...match);}
  return text;
}
function translateTree(node:ReactNode,language:Language):ReactNode {
  if(typeof node==='string')return translate(node,language);
  if(!isValidElement<Record<string,unknown>>(node))return node;
  if(typeof node.type==='string'&&['svg','code','pre','sup','sub','script','style'].includes(node.type))return node;
  const props:Record<string,unknown>={};
  for(const key of ['title','aria-label','placeholder','alt'])if(typeof node.props[key]==='string')props[key]=translate(node.props[key] as string,language);
  if(node.props.children!==undefined)props.children=Children.map(node.props.children as ReactNode,child=>translateTree(child,language));
  return cloneElement(node,props);
}
export function Localized({children}:{children:ReactNode}){const {language}=useContext(Context);return <>{Children.map(children,node=>translateTree(node,language))}</>;}
export function useI18n(){const context=useContext(Context);return {...context,t:(text:string)=>translate(text,context.language)};}
export function I18nProvider({children}:{children:ReactNode}){
  const [language,setLanguage]=useState<Language>(()=>{try{return localStorage.getItem('nucleardecay-language')==='ar'?'ar':'en';}catch{return 'en';}});
  useEffect(()=>{document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';try{localStorage.setItem('nucleardecay-language',language);}catch{/* Session-only language remains usable. */}},[language]);
  return <Context.Provider value={{language,setLanguage}}>{children}</Context.Provider>;
}
