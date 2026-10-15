import {it,expect} from 'vitest';
import {activityDecay,massFromNuclei} from '../src/science/decay';
import {plotQuantity} from '../src/science/chartData';
it('1074.5 half-lives: percentage is scaled before subnormal quantization',()=>{expect(plotQuantity({...activityDecay(1e300,1,1074.5),time:1074.5},'remaining','Bq','g').value).toBe(3.5e-322);});
it('1075 half-lives: representable percentage survives zero survival fraction',()=>{expect(plotQuantity({...activityDecay(1e300,1,1075),time:1075},'remaining','Bq','g').value).toBe(2.47e-322);});
it('a mass-fraction division rescues an otherwise-underflowing intermediate',()=>{expect(massFromNuclei(1e-300,1,1e-100)).toBeGreaterThan(0);});
