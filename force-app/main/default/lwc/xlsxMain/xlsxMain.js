import { LightningElement, api } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import readFileFromRecord from '@salesforce/apex/ReadFileData.readFileFromRecord';
import workbook from "@salesforce/resourceUrl/xlsx_new";
export default class XlsxMain extends LightningElement {
  @api headerList;
  @api filename;
  @api worksheetNameList;
  @api sheetData;
  librariesLoaded = false;
  
  renderedCallback() {
    console.log("renderedCallback xlsx",workbook);
    if (this.librariesLoaded) return;
    this.librariesLoaded = true;
    Promise.all([loadScript(this, workbook + "/xlsx/xlsx.full.min.js")])
      .then(() => {
        console.log("success");
      })
      .catch(error => {
        console.log("failure");
      });
    }

  async readFromFile(XLS) {
    let returnVal = await readFileFromRecord({recordId:'test'})
    
    let wb = XLS.read(returnVal, {type:'binary', bookVBA:true,raw:true,bookFiles:true});
    console.log(this.to_json(wb,XLS));
    this.to_xlsm(wb,XLS);
    }

    to_json(workbook,XLS) {
        var result = {};
        console.log('workbook1:' + workbook);
		workbook.SheetNames.forEach(function(sheetName) {
			var roa = XLS.utils.sheet_to_json(workbook.Sheets[sheetName], {header:1});
			if(roa.length) result[sheetName] = roa;
		});
		return JSON.stringify(result, 2, 2);
    }   
    
    to_xlsm(workbook,XLS) {
        var result = {};
        console.log('workbook2:' + workbook);
        console.log('sheet name: ' + workbook.SheetNames[0]);
        /* Write Excel and Download */
        XLS.writeFile(workbook, this.filename);
    }   
    

  @api download() {
    const XLSX = window.XLSX;
    this.readFromFile(XLSX);
    
    let xlsData = this.sheetData;
    let xlsHeader = this.headerList;
    let ws_name = this.worksheetNameList;
    let createXLSLFormatObj = Array(xlsData.length).fill([]);
    //let xlsRowsKeys = [];
    // form header list 
    xlsHeader.forEach((item, index) => createXLSLFormatObj[index] = [item])

    // form data key list 
    xlsData.forEach((item, selectedRowIndex)=> {
        let xlsRowKey = Object.keys(item[0]);
        item.forEach((value, index) => {
            var innerRowData = [];
            xlsRowKey.forEach(item=>{
                innerRowData.push(value[item]);
            })
            createXLSLFormatObj[selectedRowIndex].push(innerRowData);
        })

    });
    /* creating new Excel */
    //var wb = XLSX.utils.book_new();
    
    /* creating new worksheet */
    //Original code
    /*  
    var ws = Array(createXLSLFormatObj.length).fill([]);
    for (let i = 0; i < ws.length; i++) {
      // converting data to excel format and puhing to worksheet 
      let data = XLSX.utils.aoa_to_sheet(createXLSLFormatObj[i]);
      ws[i] = [...ws[i], data];

      // Add worksheet to Excel 
      XLSX.utils.book_append_sheet(wb, ws[i][0], ws_name[i]);
    }
    */
 

    /* Write Excel and Download */
    //XLSX.writeFile(wb, this.filename);
  }
}