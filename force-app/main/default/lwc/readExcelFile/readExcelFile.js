import { LightningElement,track } from 'lwc';

import sheetJS from '@salesforce/resourceUrl/xlsx_new';

import {loadScript } from 'lightning/platformResourceLoader';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class ReadExcelFile extends LightningElement {

    @track disableButton = true;
    //variables to use 
     worksheetName;
     cellRange;
     valueForCell;

    connectedCallback() {
        console.log("renderedCallback xlsx");
        if (this.librariesLoaded) return;
        this.librariesLoaded = true;
        Promise.all([loadScript(this, sheetJS + "/xlsx_new/xlsx.full.min.js")])
        .then(() => {
            console.log("success");
            console.log(' load  sheet JS complete ');
            this.disableButton=false;
        })
        .catch(error => {
            console.log("failure");
        });
  }

    excelFileToJson(event) {
        //getting files list from the front-end
        var f = event.target.files[0];
        var reader = new FileReader();
        //varibales
        var ws=this.worksheetName;
        var range=this.cellRange;
        var val=this.valueForCell;
        var flagRange=range.includes(':')?true:false;
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            console.time("read");
            var wb = XLSX.read(data, {type: "array", template: true, skipParse: true, bookVBA:true});
            console.timeEnd("read");
            /* Modify data */
            console.time("edit");
            console.log("editting start");

            let arrVal=val.split(',');
            console.log('arrVal',arrVal);

            if(typeof range == "string" && flagRange==true) {
                range = XLSX.utils.decode_range(range);
                /*range.s.c=1;
                range.e.c=4;*/
            }
            console.log('rangesss##',range);
            XLSX.utils.template_set_aoa(wb, ws, range, flagRange==false?[[val]]:[arrVal]);
            console.timeEnd("edit");
            /* Write new file */
            var ext = f && f.name && f.name.slice(-5) == ".xlsm" ? "xlsm" : "xlsx";
            console.time("write");
            XLSX.writeFile(wb, "ExcelFile_AMSM-NA001_AMSR-1."+ ext, {template: true});
            console.timeEnd("write");
        };
        reader.readAsArrayBuffer(f);
    };

    handleWSChange(event){
        this.worksheetName=event.target.value;
    }
     handleRangeChange(event){
         this.cellRange=event.target.value;
    }
     handleValueChange(event){
         this.valueForCell=event.target.value;
    }

}