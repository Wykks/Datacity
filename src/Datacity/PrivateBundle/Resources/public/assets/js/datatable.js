var TableEditable = function (options) {
    var defaults = {
        "publicKey": "4561321edgjlkjd",
        "filePath": "9115b0a5c76f679f456e3772bd3c0b7a",
        "jqueryTable": $('#sample_editable_1'),
        "jqueryNewButton": $('#sample_editable_1_new'),
        "url": "http://localhost:4567"
    };
    var params = $.extend(defaults, options);

    this.publicKey = params.publicKey;
    this.filePath = params.filePath;
    this.jqueryTable = params.jqueryTable;
    this.jqueryNewButton = params.jqueryNewButton;
    this.url = params.url;
    this.oTable = null;
    this.nEditing = null;
    this.bindingArray = [];
    this.rows = null;
    this.init();
};

TableEditable.prototype = {
    restoreRow: function(oTable, nRow) {
        var aData = oTable.fnGetData(nRow);
        var jqTds = $('>td', nRow);

        for (var i = 0, iLen = jqTds.length; i < iLen; i++) {
            oTable.fnUpdate(aData[i], nRow, i, false);
        }
        oTable.fnDraw();
    },
    editRow: function(oTable, nRow) {
        var aData = oTable.fnGetData(nRow);
        var jqTds = $('>td', nRow);
        jqTds[0].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[0] + '">';
        jqTds[1].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[1] + '">';
        jqTds[2].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[2] + '">';
        jqTds[3].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[3] + '">';
        jqTds[4].innerHTML = '<a class="edit" href="">Save</a>';
        jqTds[5].innerHTML = '<a class="cancel" href="">Cancel</a>';
    },
    saveRow: function(oTable, nRow) {
        var jqInputs = $('input', nRow);
        oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
        oTable.fnUpdate(jqInputs[1].value, nRow, 1, false);
        oTable.fnUpdate(jqInputs[2].value, nRow, 2, false);
        oTable.fnUpdate(jqInputs[3].value, nRow, 3, false);
        oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 4, false);
        oTable.fnUpdate('<a class="delete" href="">Delete</a>', nRow, 5, false);
        oTable.fnDraw();
    },
    cancelEditRow: function(oTable, nRow) {
        var jqInputs = $('input', nRow);
        oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
        oTable.fnUpdate(jqInputs[1].value, nRow, 1, false);
        oTable.fnUpdate(jqInputs[2].value, nRow, 2, false);
        oTable.fnUpdate(jqInputs[3].value, nRow, 3, false);
        oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 4, false);
        oTable.fnDraw();
    },
    requestRows: function(callback) {
        var urlContent = this.url + "/user/" + this.publicKey + "/parse/" + this.filePath;
        $.ajax({
            url: urlContent,
            type: 'GET',
            success: function(response, status, jqXHR) {
                if (response.data)
                    callback(response.data);
            },
            error: function(error) {
                console.error(error);
            }
        });
    },
    generateHeaders: function(headers, headerClass) {
        var array = new Array();
        var json = {};
        var keys = Object.keys(headers);
        for (index in keys) {                    
            json = {
                "sTitle" : keys[index].replace(/ /g, "_"),
                "sClass" : headerClass
            };
            array.push(json);
        }
        return array;
    },
    generateRows: function(rows, nbfield) {
        var array = new Array();
        for (rowName in rows) {
            //TODO: VERIFICATION DU FICHIER
            subArray = new Array();
            for (rowContent in rows[rowName]) {
                subArray.push(rows[rowName][rowContent]);
            }
            array.push(subArray);  
        }
        return array;
    },
    generateTable: function(rows) {
        this.rows = rows;
        var header = this.generateHeaders(rows[0], "test");
        var row = this.generateRows(rows, header.length);
        this.oTable = this.jqueryTable.dataTable({
            "aLengthMenu": [[7, 15, 20, 100],[7, 15, 20, 100]],
            "iDisplayLength": 7,
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ records",
                "oPaginate": {
                    "sPrevious": "Prev",
                    "sNext": "Next"
                }
            },
            "aaData": row,
            "aoColumns": header
        });
        this.initCSS();
    },
    getTableColumns: function() {

    },
    initEvents: function() {
        var that = this;

        var onNewRowAction = function() {
            that.jqueryNewButton.on('click', function (e) {
                e.preventDefault();
                var aiNew = oTable.fnAddData(['', '', '', '',
                    '<a class="edit" href="">Edit</a>', '<a class="cancel" data-mode="new" href="">Cancel</a>'
                    ]);
                var nRow = oTable.fnGetNodes(aiNew[0]);
                editRow(oTable, nRow);
                nEditing = nRow;
            });
        }();
        
        var onDeleteAction = function () {
            that.jqueryTable.on('click', 'a.delete' , function (e) {
                e.preventDefault();

                if (confirm("Are you sure to delete this row ?") == false) {
                    return;
                }

                var nRow = $(this).parents('tr')[0];
                oTable.fnDeleteRow(nRow);
                alert("Deleted! Do not forget to do some ajax to sync with backend :)");
            });
        }();
        
        var onCancelAction = function() {
            that.jqueryTable.on('click', 'a.cancel' , function (e) {
                e.preventDefault();
                if ($(this).attr("data-mode") == "new") {
                    var nRow = $(this).parents('tr')[0];
                    oTable.fnDeleteRow(nRow);
                } else {
                    restoreRow(oTable, nEditing);
                    nEditing = null;
                }
            });
        }();
        
        var onEditAction = function() {
            that.jqueryTable.on('click', 'a.edit' , function (e) {
                e.preventDefault();

                /* Get the row as a parent of the link that was clicked on */
                var nRow = $(this).parents('tr')[0];

                if (nEditing !== null && nEditing != nRow) {
                    /* Currently editing - but not this row - restore the old before continuing to edit mode */
                    restoreRow(oTable, nEditing);
                    editRow(oTable, nRow);
                    nEditing = nRow;
                } else if (nEditing == nRow && this.innerHTML == "Save") {
                    /* Editing this row and want to save it */
                    saveRow(oTable, nEditing);
                    nEditing = null;
                    alert("Updated! Do not forget to do some ajax to sync with backend :)");
                } else {
                    /* No edit in progress - let's start one */
                    editRow(oTable, nRow);
                    nEditing = nRow;
                }
            });
        }();

        var onCategorySetColor = function() {
            that.jqueryTable.on('click', 'th', function (e) {
                var color = $('.boxColored').css('background-color');
                if (color === "rgb(255, 255, 255)" || color === "rgba(0, 0, 0, 0)") {
                    $(this).css('color', 'black');
                    deleteFromArray(that.bindingArray, "color", $(this).css('background-color'))
                }
                else {
                    $(this).css('color', 'white');
                    var textBindedCategory = null;
                    $('.btnmodel').each(function(index) {
                        if ($(this).css("background-color") === color)
                            textBindedCategory = $(this).text();
                    });
                    if (textBindedCategory) {
                        var bindedColumn = new BindedColumn(color, $(this).text(), textBindedCategory);
                        that.bindingArray.push(bindedColumn);
                    }
                }
                $(this).css('background-color', $('.boxColored').css('background-color'));
            });
        }();

        var onUploadSource = function() {
            $('.uploadSource').on('click', function() {
                var dataJSON = {
                    "jsonData": that.rows,
                    "sourceName": "exemple",
                    "city": "montpellier",
                    "databiding": that.bindingArray
                }
                $.ajax({
                    url: that.url + '/user/' + that.publicKey + '/source/services_publics/upload',
                    type: 'POST',
                    data: dataJSON,
                    dataType: 'json',
                    success: function(response, status, jqXHR) {
                       console.log(response);
                    },
                    error: function(error) {
                        console.error(error);
                    }
                });
            });
        }();
    },
    initCSS: function() {
        $('.table-scrollable').css('overflow-y', 'scroll').css('height', '300px');
        jQuery('#sample_editable_1_wrapper .dataTables_filter input').addClass("form-control input-medium"); // modify table search input
        jQuery('#sample_editable_1_wrapper .dataTables_length select').addClass("form-control input-small"); // modify table per page dropdown
        jQuery('#sample_editable_1_wrapper .dataTables_length select').select2({
            showSearchInput : false //hide search box with special css class
        });  
    },
    init: function () {
        //TODO: VIRER CETTE VARIABLE
        var nEditing = null;
        var that = this;
        this.requestRows(function(rows) {
            that.generateTable(rows);
            that.initEvents();
        }); 
       
    }
};

var BindedColumn = function(color, text, textBiding) {
    this[text] = textBiding;
    this.color = color;
}

BindedColumn.prototype = {

};

