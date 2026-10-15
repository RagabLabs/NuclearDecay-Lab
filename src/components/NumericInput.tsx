import {useState,type InputHTMLAttributes} from 'react';
import {compactInput} from '../utils/format';
import {useI18n} from '../i18n';
/** Presentation never overwrites the stored raw value. Focus exposes the exact editable input. */
export function NumericInput({value,onChange,displayValue,...props}:Omit<InputHTMLAttributes<HTMLInputElement>,'value'> & {value:string;displayValue?:string}){
 const [focused,setFocused]=useState(false);
 const {t}=useI18n();
 const shown=focused?value:displayValue??(value.length>14?compactInput(value):value);
 return <input {...props} value={shown} data-numerical-value={value} title={shown!==value?`${t('Numerical input retained')}: ${value}`:props.title} onFocus={e=>{setFocused(true);props.onFocus?.(e);}} onBlur={e=>{setFocused(false);props.onBlur?.(e);}} onChange={onChange}/>;
}
