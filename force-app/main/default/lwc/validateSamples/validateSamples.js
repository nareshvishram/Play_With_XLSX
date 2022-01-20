import { LightningElement, track } from 'lwc';

import sheetJS from '@salesforce/resourceUrl/xlsx_new';

import {loadScript } from 'lightning/platformResourceLoader';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ValidateSamples extends LightningElement {
    
    @track disableButton = true;
    //variables to use 
     worksheetName;
     cellRange;
    @track valueForCell;
    index=0;

    connectedCallback() {
        console.log("renderedCallback xlsx");
        if (this.librariesLoaded) return;
        this.librariesLoaded = true;
        Promise.all([loadScript(this, sheetJS + "/xlsx_new/xlsx.full.min.js")])
        .then(() => {
            console.log("success");
            console.log(' load  sheet JS complete ');
            //this.disableButton=false;
            this.index=1;
        })
        .catch(error => {
            console.log("failure");
        });
  }

    handleValueChange(event){
        this.valueForCell=event.target.value;
        if(this.valueForCell==null || this.valueForCell==''){
            this.disableButton=true;
        }else{
            this.disableButton=false;
        }
    }
    operations(event) {
        //getting files list from the front-end
        this.index++;
        var f = event.target.files[0];
        var reader = new FileReader();
        var range='D2:D11';
        let ws='Samples';
        let valueToInsert=this.valueForCell;
        let localIndex=this.index;
        reader.onload =(e)=> {
            var data = new Uint8Array(e.target.result);
            // Validation for existing samples
            if(typeof range == "string") range = XLSX.utils.decode_range(range);
            const workBookArray =XLSX.read(data, {type: "array"});
            const sheet=workBookArray.Sheets[workBookArray.SheetNames[2]];
            let availableSampleMap=new Map();
            let sampleAvailOrNot=false;
            for(var R = range.s.r; R <= range.e.r; ++R) {
                for(var C = range.s.c; C <= range.e.c; ++C) {
                    var cell_address = {c:C, r:R};
                    /* if an A1-style address is needed, encode the address */
                    var cell_ref = XLSX.utils.encode_cell(cell_address);
                    let cellData=sheet[cell_ref]
                    if(cellData==null){
                        sampleAvailOrNot=true;
                        break;
                    }
                    console.log('cell_ref',cellData);
                    availableSampleMap.set(cellData["v"].toLowerCase(),1);
                }
            }
            //Read the file to write it
            var wb = XLSX.read(data, {type: "array", template: true, skipParse: true, bookVBA:true});
            
            //Create a 2d array
            var aoa=Array(1).fill().map(entry => Array(1))
            aoa[0][0]=valueToInsert.trim();
            //print whether it's available or not?
            console.log('map',availableSampleMap);
            valueToInsert=valueToInsert.trim().toLowerCase();
            let valueToCompare=valueToInsert;
            console.log('valueimsert',valueToInsert);
            for(let i=0;i<availableSampleMap.size;i++){
                if(availableSampleMap.has(valueToCompare)){
                    this.errorOrNot=true;
                    break;
                }
            }
            console.log('aoa',aoa,this.errorOrNot);
            if(!this.errorOrNot){
                XLSX.utils.template_set_aoa(wb, ws, "D1"+localIndex,aoa);
                /* Write new file */
                var ext = f && f.name && f.name.slice(-5) == ".xlsm" ? "xlsm" : "xlsx";
                XLSX.writeFile(wb, "ExcelFile_AMSM-NA001_AMSR-1."+ ext, {template: true});
            }else{
                const evt = new ShowToastEvent({
                title:'Duplicate Value Found!!' ,
                message: `Value already present in the Samples worksheet with name: `+ valueToInsert+`- Mission aborted!!`,
                variant: 'error',
            });
            this.dispatchEvent(evt);
                
            }
        };
        reader.readAsArrayBuffer(f);
    };

}