/**
 * Created by Fanjiahe on 2016/10/22 0022.
 */
module.exports = function (admin)
{
	var fs = require('fs');
	var json2xls = require('json2xls');
	//var crypto = require('crypto');

	var collections = [];
	var records = [];
	var trends = "memberConsumptionTrends";


	/**
	 * 获取时间
	 * @param {string|number} record 合集的名称
	 * */
	function getRecordDate(record)
	{
		var date = String(record).replace('memberConsumptionRecords', '');
		var year = date.substring(0,4);
		var month = date.substring(4,6);
		var data = {date:date, year: year, month:month};
		return data;
	}

	
	function sortRecords(a,b)
	{
		var dateA = getRecordDate(a);
		var dateB = getRecordDate(b);
		return Number(dateA.date) - Number(dateB.date);
	}

	/**
	 *  解析 所需的集合
	 * */
	function analysisMemberConsumptionCollections()
	{
		for(var count = 0; count < collections.length; count++)
		{
			var currentCollectionName = collections[count];
			if(currentCollectionName.indexOf('memberConsumptionRecords') != -1)
			{
				getRecordDate(currentCollectionName);
				records.push(currentCollectionName)
			}
		}
	}


	/**
	 * 获取所有的集合名称
	 * */
	function getCollections(callBack)
	{
		if (admin.mdb)
		{
			admin.mdb.collection("system.indexes").find().each(function (er, doc)
			{
				if (doc && doc.ns)
				{
					var currentName = doc.ns.split('.')[1];
					collections.push(currentName)
				}

				if (!doc)
				{
					analysisMemberConsumptionCollections();
					if(callBack)
					{
						callBack();
					}
				}
			});
		}
	}


	function randomString(len) {
		len = len || 32;
		var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
		var maxPos = $chars.length;
		var pwd = '';
		for (i = 0; i < len; i++) {
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
		}
		return pwd;
	}

	//test.cgbuser

	var rtn = {
		getUserConsumptionRecordIndex: function (req, res)
		{
			if (!admin.checkLevel(req, [4,10])) {
				res.end();
				return;
			}
			function getUserConsumptionRecordIndex()
			{
				if (admin.mdb)
				{
					records.sort(sortRecords);
					var newRecords = [];

					for(var count = 0; count <records.length; count++)
					{
						var newRecord = getRecordDate(records[count]);
						newRecords.push(Number(newRecord.date));
					}
					res.json({total: newRecords.length, rows: newRecords});
				}
			}

			if (collections && collections.length)
			{
				getUserConsumptionRecordIndex();
			}
			else
			{
				getCollections(getUserConsumptionRecordIndex);
			}
		},
		getUserConsumptionRecord:function (req, res)
		{
			if (!admin.checkLevel(req, [4,10])) {
				res.end();
				return;
			}
			if (admin.mdb)
			{
				var msg = req.body;
				var index = msg.index || 0;
				if(!msg._id)
				{
					res.end();
					return;
				}
				delete msg.index;

				function CalculationToatal(data)
				{
					var allBuyNum = 0;
					var allBuyMoney = 0;
					var unitPrice = 0;
					var lastMoney = 0;
					var currentDate = 0;
					for(var key in data)
					{
						if(!data.hasOwnProperty(key) || key == '_id')
						{
							continue;
						}
						allBuyNum += data[key].buyNum;
						allBuyMoney += data[key].buyMoney;
						if(Number(key) >　currentDate)
						{
							currentDate = Number(key);
							lastMoney = data[key].money;
						}
					}

					if(allBuyMoney && allBuyNum)
					{
						unitPrice = allBuyMoney / allBuyNum;
					}

					return {unitPrice:unitPrice, lastMoney:lastMoney};
				}

				function getUserConsumptionRecord()
				{
					if(!records || !records.length)
					{
						res.end();
						return;
					}

					var currentRecordName = records[index];
					var data = [];
					var other = {};
					other.previousUnitPrice = 0;
					other.previousMoney = 0;

					other.currentUnitPrice = 0;
					other.currentMoney = 0;
					admin.mdb.collection(currentRecordName).find(msg).each(function (er, doc1)
					{
						if (doc1)
						{
							data.push(doc1);
							var tempData1 = CalculationToatal(doc1);
							other.currentUnitPrice = tempData1.unitPrice;
							other.currentMoney = tempData1.lastMoney;
						}

						if(!doc1)
						{
							if(index > 0)
							{
								var lastRecordName = records[index-1];
								admin.mdb.collection(lastRecordName).find(msg).each(function (er, doc2)
								{
									if (doc2)
									{
										var tempData2 = CalculationToatal(doc2);
										other.previousUnitPrice = tempData2.unitPrice;
										other.previousMoney = tempData2.lastMoney;
									}

									if(!doc2)
									{
										res.json({total: data.length, rows: data, statistics:other});
									}
								});
							}
							else
							{
								res.json({total: data.length, rows: data, statistics:other});
							}
						}
					});
				}

				if (collections && collections.length)
				{
					getUserConsumptionRecord();
				}
				else
				{
					getCollections(getUserConsumptionRecord);
				}


			}
		},
		getUserConsumptionTrends:function (req,res)
		{
			if (!admin.checkLevel(req, [4,10])) {
				res.end();
				return;
			}
			if (admin.mdb)
			{
				var msg = req.body;
				if(!msg.date)
				{
					res.end();
					return;
				}
				msg._id = msg.date;
				delete msg.date;
				var data = [];

				var currentDate = getRecordDate(msg._id);
				var startYear = Number(currentDate.year) - (Number(currentDate.month) == 1);
				var startMonth = Number(currentDate.month) == 1 ? 12 : (Number(currentDate.month)-1);
				var startDate = Number(startYear  + (startMonth >= 10 ? '' : '0') + startMonth);

				var endYear = Number(currentDate.year) + (Number(currentDate.month) == 12);
				var endMonth = Number(currentDate.month) == 12 ? 1 : (Number(currentDate.month)+1);
				var endDate = Number(endYear + (endMonth >= 10 ? '' : '0') + endMonth);

				msg = {_id: {$lte:endDate, $gte:startDate}};
				getRecordDate(msg._id);
				admin.mdb.collection(trends).find(msg).each(function (er, doc)
				{
					if (doc)
					{
						doc.date = doc._id;
						delete doc._id;
						delete doc.total;
						data.push(doc);
					}

					if(!doc)
					{
						res.json({total: data.length, rows: data});
					}
				});

			}
		},
		downloadExcelFile:function (req,res)
		{
			if (!admin.checkLevel(req, [1, 3, 4,10])) {
				res.end();
				return;
			}

			var msg = req.body;
			var data = msg.data;
			if(data && data.length)
			{
				var xls = json2xls(data);
				var name = randomString(32) + '.xlsx';
				var fileName = './public/researcherui/temp/' + name;
				fs.writeFileSync(fileName, xls, 'binary');
				res.json('/researcherui/temp/' + name);
			}
			else
			{
				res.end();
			}
		}
	};
	return rtn;
};





