import { LightningElement,track } from 'lwc';

import sheetJS from '@salesforce/resourceUrl/xlsx';

import {loadScript } from 'lightning/platformResourceLoader';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ReadExcelFile extends LightningElement {
    @track dataList = [];

    @track disableButton = true;

    connectedCallback() {
        console.log("renderedCallback xlsx");
        if (this.librariesLoaded) return;
        this.librariesLoaded = true;
        Promise.all([loadScript(this, sheetJS + "/xlsx/xlsx.full.min.js")])
        .then(() => {
            console.log("success");
            console.log(' load  sheet JS complete ');
            this.disableButton = false;
        })
        .catch(error => {
            console.log("failure");
        });
  }

    excelFileToJson(event) {
        event.preventDefault();
        let files = event.target.files;
        const analysisExcel = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
        analysisExcel(files[0])
        .then((result) => {
            let datas = []; //  Store the acquired data 
            let XLSX = window.XLSX;
            let workbook = XLSX.read(result, {
                type: 'binary'
            });
            for (let sheet in workbook.Sheets) {
                if (workbook.Sheets.hasOwnProperty(sheet)) {
                    datas = datas.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                }
            }
            this.dataList = datas;
            const toastEvent = new ShowToastEvent({
                variant: "success",
                message: ' The file has been uploaded and parsed successfully ',
            });
            this.dispatchEvent(toastEvent);
        });
    }
    printResult() {
        console.log(JSON.stringify(this.dataList));
        
    }

}