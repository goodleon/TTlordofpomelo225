#!/usr/bin/python
# -*- coding: UTF-8 -*-

#采集
#文件名：memberTotal.csv
# memberMoney20161226.csv + memberRetention.csv ==> memberTotal.csv
#执行:
#python memberTotal.py /root/csv/memberMomey/scmj /root/csv/memberMomey/memberAll/scmj

import os
import sys
import time

#过滤特殊符号
def isNumberString(eLogStr):
	#print 'isNumberString = ',eLogStr, type(eLogStr)
	if eLogStr == '' or eLogStr == '\n' or 'e' in eLogStr or '"' in eLogStr:
		return False;
	else:
		return True;
		
#指定文件后缀
def endWith(*endstring):
	ends = endstring
	def run(s):
			f = map(s.endswith,ends)
			if True in f: return s
	return run
	
#非指定文件后缀
def notEndWith(*endstring):
	ends = endstring
	def run(s):
			f = map(s.endswith,ends)
			if False in f: return s
	return run
	
	
ticks = time.time()#耗时
src_path = sys.argv[1]
des_path = sys.argv[2]
memberTotalFile = des_path+'/memberTotal.csv'
os.system('mkdir -p %s' % des_path)

all_file = os.listdir(src_path)
#a = endWith('.txt','.py')
fType = endWith('memberRetention.csv')#csv文件
list_file = filter(fType,all_file)
list_file_len = len(list_file)
list_file_idx = 0


"""
会员注册统计
_id,count,dailyLiving
20160914,1,0
20160917,1,0
20160928,1,0
"""
out_dict = {}
for i in list_file:
	list_file_idx = list_file_idx + 1
	print "%d/%d: %s"%(list_file_idx,list_file_len, i)
	src_file = src_path + '/' + i
	#des_file = des_path + '/' + i
	fIndex = 0
	with open(src_file, 'r') as src:
		a = src.readlines()
		for line in a:
			b = line.split(',')
			fIndex = fIndex + 1
			#print 'fIndex = ', fIndex
			#print 'b = ', b
			if(len(b) < 1 or b[0] == '_id'):
				continue;
			day = b[0]
			reginCount = b[1]
			month = day[0:6]
			if month in out_dict:
				out_dict[month] += long(reginCount);
			else:
				out_dict[month] = long(reginCount);
			#print 'out_dict:', out_dict
	
	
'''
	#排序后计算
	out_dict = sorted(out_dict.iteritems(), key=lambda d:d[0], reverse = False)
	print out_dict
	out_dict_len = len(out_dict)
	allMemberReg = 0;
	for idx in range(out_dict_len):
		allMemberReg += long(out_dict[idx][1]);
		print('%s,%s,%d' % (out_dict[idx][0], out_dict[idx][1], allMemberReg))
	#for key in out_dict.keys():
	#	print('%s,%s' % (key, out_dict[key]))
'''	
	
	
	
########################################################################################
'''
mid,buyNum,buyMoney,buyTotal,buyTime,buyNote,buyType,byMid,byName,orderNumber,aliOrderNum,byMoney,memberMoney
765014,368,0,,2016-12-25T16:00:41.500Z,"推荐返利",,765014,"欧妙娟",,,,


mid,buyNum,buyMoney,buyTotal,buyTime,buyNote,buyType,byMid,byName,orderNumber,aliOrderNum,byMoneymemberMoney
518936,900,158000,,2016-06-04T07:18:31.175Z,"","1",965479,"超超",,,
871722,500,113000,,2016-06-03T02:12:15.145Z,"公司赠送","1",908013,"客户经理乖乖",,,
623741,900,40500,,2016-06-15T08:30:03.277Z,"","1",156172,"客户经理佳佳",,,
496534,900,37500,,2016-06-30T06:55:46.092Z,"","1",670288,"客户经理小五",,,
453052,900,34000,,2016-06-25T11:05:25.122Z,"","1",199978,"丫丫",,,
113523,1900,30500,,2016-06-07T13:18:03.250Z,"","1",156172,"客户经理佳佳",,,
369006,900,30500,,2016-06-17T13:41:41.068Z,"","1",199978,"丫丫",,,
878517,900,27000,,2016-06-07T10:13:34.373Z,"","1",965479,"超超",,,
369092,4000,27000,,2016-06-15T08:35:04.163Z,"","1",199978,"丫丫",,,
'''	

fType = notEndWith('memberRetention.csv')#非统计会员文件
list_file = filter(fType,all_file)
list_file_len = len(list_file)
list_file_idx = 0
print '=====', list_file, list_file_len
	
	
memberDic = {} #所有
memberDicMonth = {} #每个月
memberDicMonthDay = {} #每个月每天
for i in list_file:
	list_file_idx = list_file_idx + 1
	print "%d/%d: %s"%(list_file_idx,list_file_len, i)
	src_file = src_path + '/' + i
	des_file = des_path + '/' + i
	fIndex = 0
	with open(src_file, 'r') as src:
		a = src.readlines()
		for line in a:
			b = line.split(',')
			fIndex = fIndex + 1
			#print 'fIndex = ', fIndex
			#print 'b = ', b
			if(len(b) < 1 or b[0] == '_id'or b[0] == 'mid' or b[2] == ''):
				continue;	
				
				
			#所有
			id = str(b[0]) 	#mid
			money = long(b[2])	#充值
			if money < 1:
				continue;
				
			if id not in memberDic:
				memberDic[id] = 0L;
			memberDic[id] += money;
				
			#每个月统计		
			month = b[4][0:4] + b[4][5:7] #月
			#print 'month = ',month,i
			if month not in memberDicMonth:
				memberDicMonth[month] = {};
			if id not in memberDicMonth[month]:
				memberDicMonth[month][id] = 0L;
				
			memberDicMonth[month][id] += money;
			
			#每天充值统计
			day = b[4][0:10] #天
			if day not in memberDicMonthDay:
				memberDicMonthDay[day] = {};
				
			if id not in memberDicMonthDay[day]:
				memberDicMonthDay[day][id] = { "money":0, "count":0};
			
			memberDicMonthDay[day][id]["count"] += 1;
			memberDicMonthDay[day][id]["money"] += money;

			
#结算
totalMember = {};
totalMoney = {};

#注册
out_dict = sorted(out_dict.iteritems(), key=lambda d:d[0], reverse = False)
print '注册',out_dict
out_dict_len = len(out_dict)
allMemberReg = 0;
for idx in range(out_dict_len):
	month = out_dict[idx][0];
	regNum = long(out_dict[idx][1]);
	if month not in totalMember:
		totalMember[month] = {
			'addReg':0, 	#注册新增
			'totalReg':0,	#注册总量
			'members':0, 	#充值人数
			'totalPay':0, 	#充值总额
			'ratioPay':0, 	#付费比例
			'preMemerPay':0,#人均充值
			'maxPay':0,		#最高充值
			'maxPayUid':'0' #最高充值的玩家id
		}
	totalMember[month]['addReg'] = regNum;
	allMemberReg += regNum;
	totalMember[month]['totalReg'] += allMemberReg;
	
memberDicMonth = sorted(memberDicMonth.iteritems(), key=lambda d:d[0], reverse = False)
memberDicMonthLen = len(memberDicMonth)
#print 'memberDic = ', memberDic
#print 'memberDicMonth = ', memberDicMonth
print '#####memberDicMonthLen = ', memberDicMonthLen

#充值
for idx in range(memberDicMonthLen):
	tMonth = str(memberDicMonth[idx][0]) #月份
	tUids = memberDicMonth[idx][1]		#{uid:money}
	if tMonth not in totalMember:
		totalMember[tMonth] = {
			'addReg':0, 	#注册新增
			'totalReg':0,	#注册总量
			'members':0, 	#充值人数
			'totalPay':0, 	#充值总额
			'ratioPay':0, 	#付费比例
			'preMemerPay':0,#人均充值
			'maxPay':0,		#最高充值
			'maxPayUid':'0' #最高充值的玩家id
		}
		
	totalMember[tMonth]['members'] = len(tUids);
	for key in tUids.keys():
		if tUids[key] > totalMember[tMonth]['maxPay'] :
			totalMember[tMonth]['maxPayUid'] = key;
			totalMember[tMonth]['maxPay'] = tUids[key];
			print "最高充值|uid", totalMember[tMonth]['maxPay'], totalMember[tMonth]['maxPayUid']
		totalMember[tMonth]['totalPay'] += tUids[key]
		
		#uid记录
		if tMonth not in totalMoney :
			totalMoney[tMonth] = {};
		if key not in totalMoney[tMonth]:
			totalMoney[tMonth][key] = 0;
		totalMoney[tMonth][key] += tUids[key];
		
	
	if totalMember[tMonth]['members'] > 0 :
		totalMember[tMonth]['preMemerPay'] = round(float(totalMember[tMonth]['totalPay']) / totalMember[tMonth]['members'],2) #人均充值 = 充值总额 / 充值人数 * 100 + "%"
	if totalMember[tMonth]['totalReg'] > 0 :
		totalMember[tMonth]['ratioPay'] = round(float(totalMember[tMonth]['members']) / totalMember[tMonth]['totalReg'],1) #付费比例 = 充值人数 / 注册总量 * 100 + "%"
	print "人均充值, 付费比例 ", tMonth, totalMember[tMonth]['preMemerPay'],totalMember[tMonth]['ratioPay']




#写文件########################################################
title = '月份, 注册新增, 注册总人数, 充值人数, 最高充值|uid, 充值总额, (充值人数/注册总人数)付费比例, (充值总额/充值人数)人均充值';
print title
with open(memberTotalFile, 'w') as des:
	des.write(title+'\n')
tmpTotalMember = sorted(totalMember.iteritems(), key=lambda d:d[0], reverse = False)
totalMemberLen = len(tmpTotalMember);
#print tmpTotalMember

allMember = {
			'addReg':allMemberReg, 	#注册新增
			'totalReg':allMemberReg,	#注册总人数
			'members':len(memberDic), 	#充值人数
			'totalPay':0, 	#充值总额
			'ratioPay':0, 	#付费比例
			'preMemerPay':0,#人均充值
			'maxPay':0,		#最高充值
			'maxPayUid':'0' #最高充值的玩家id
			}
			
			
with open(memberTotalFile, 'a') as des:
	for idx in range(totalMemberLen):
		month = tmpTotalMember[idx][0];
		data = tmpTotalMember[idx][1];
		allMember['totalPay'] += data['totalPay']
		if data['maxPay'] > allMember['maxPay']:
			allMember['maxPayUid'] = data['maxPayUid']
			allMember['maxPay'] = data['maxPay']
		context = ('%s,%d,%d,%d,%d|%s,%d,%s,%s' % (month, data['addReg'], data['totalReg'], data['members'], data['maxPay'], data['maxPayUid'], data['totalPay'], 
			'('+str(data['members']) + '/' +str(data['totalReg'])+')'+str(data['ratioPay']*100)+'%', 
			'('+str(data['totalPay'])+'/'+str(data['members'])+')'+str(data['preMemerPay']*100)+'%'))
		print context
		des.write(context+'\n')

#for key in totalMember.keys():
#	print key, totalMember[key]
if allMember['totalReg'] > 0:
	allMember['ratioPay'] = round(float(allMember['members'])/allMember['totalReg'],2);
if allMember['members'] > 0 :
	allMember['preMemerPay'] = round(float(allMember['totalPay'])/allMember['members'],2);
titleEnd = '总  计,'+str(allMember['addReg'])+','+str(allMember['totalReg'])+','+str(allMember['members'])+','+str(allMember['maxPay'])+'|'+allMember['maxPayUid']+','+str(allMember['totalPay'])+','+'('+str(allMember['members']) + '/' +str(allMember['totalReg'])+')'+str(allMember['ratioPay']*100)+'%,'+'('+str(allMember['totalPay']) + '/' +str(allMember['members'])+')'+str(allMember['preMemerPay']*100)+'%';
with open(memberTotalFile, 'a') as des:
	des.write(titleEnd)
print titleEnd



'''
充值排名(前50)
index, money, uid
0, 87000, 603942
1, 65000, 239367
2, 50000, 942321
3, 49000, 924583

#每月会员充值排名
#totalMoney{'201612':{'100023':20000,'100024':5000 }}
tmpMoney = {}
for key in totalMoney.keys():
	tmpMoney[key] = sorted(totalMoney[key].iteritems(), key=lambda d:d[1], reverse = False)
print '会员充值',tmpMoney
'''

#最终会员充值排名
maxRank = 50;
tmpMemberDic = sorted(memberDic.iteritems(), key=lambda d:d[1], reverse = True)
tmpMemberDicLen = len(tmpMemberDic);
print '###tmpMemberDicLen = ',tmpMemberDicLen, len(memberDic)
title = '\n\n充值排名(前'+str(maxRank)+')\nindex, money, uid';
print title
with open(memberTotalFile, 'a') as des:
	des.write(title+'\n')
with open(memberTotalFile, 'a') as des:	
	for idx in range(tmpMemberDicLen):
		if idx+1 > maxRank:
			break;			
		uid = tmpMemberDic[idx][0];
		money = tmpMemberDic[idx][1];
		context = str(idx)+', '+str(money)+', '+uid
		print '------',context;
		des.write(context+'\n')


		

		
#会员每天 充值额度 充值次数
'''
文件名：0_603942.csv 

格式：
充值日期,充值额度,充值次数
2016-11-30, 0, 	0 
2016-12-01, 500, 1 
2016-12-02, 500, 1 
2016-12-03, 500, 1 
2016-12-04, 500, 1 
2016-12-05, 500, 1 
2016-12-06, 500, 1 
2016-12-07, 500, 1 
2016-12-08, 500, 1 
2016-12-09, 500, 1 
2016-12-10, 1000, 2 
'''
tmpMemberDicMonthDay = sorted(memberDicMonthDay.iteritems(), key=lambda d:d[0], reverse = False)
tmpMemberDicMonthDayLen = len(tmpMemberDicMonthDay);
print '会员每天充值',tmpMemberDicMonthDayLen
'''
for idx in range(tmpMemberDicLen):
	if idx+1 > maxRank:
		break;	
	uid = str(tmpMemberDic[idx][0]);
	money = tmpMemberDic[idx][1];
	
	uidCsv = des_path+'/'+str(idx)+"_"+uid+'.csv'
	title = '充值日期,充值额度,充值次数'
	with open(uidCsv, 'a') as des:
		des.write(title+'\n')
		
	context = "";
	for dayIdx in range(tmpMemberDicMonthDayLen):		
		day = tmpMemberDicMonthDay[dayIdx][0];
		uInfo = tmpMemberDicMonthDay[dayIdx][1];
		
		if uid in uInfo:
			money = uInfo[uid]["money"];
			count = uInfo[uid]["count"];
			#print "会员",uid, day,money,count
			context += day +", "+ str(money) + ", "+str(count)+" \n"
		else:
			#print "会员",uid, day,0,0
			context += day + ", 0, 	0 \n"
		print context;
		
	with open(uidCsv, 'a') as des:
		des.write(context+'\n')
	
'''

uidCsv = des_path+'/memberInfo.csv'
#title = '充值日期,充值额度,充值次数'
#title = 'date,money,count'
#with open(uidCsv, 'a') as des:
#	des.write(title+'\n')
	
uidsInfo = 'date,\t';
for idx in range(tmpMemberDicLen):
	#if idx+1 > maxRank:
	if idx+1 > maxRank:
		break;	
	uid = str(tmpMemberDic[idx][0]);
	uidsInfo += str(idx)+"_"+uid+"money,\t";
	uidsInfo += str(idx)+"_"+uid+"count,\t";	
with open(uidCsv, 'a') as des:
	des.write(uidsInfo+'\n')
	

	
memberCountMoney = {};
for dayIdx in range(tmpMemberDicMonthDayLen):		
	day = tmpMemberDicMonthDay[dayIdx][0];
	uInfo = tmpMemberDicMonthDay[dayIdx][1];
	context = ""+day+",\t";
	for idx in range(tmpMemberDicLen):
		if idx+1 > maxRank:
			break;	
		uid = str(tmpMemberDic[idx][0]);
		money = 0;
		count = 0;
		if uid in uInfo:
			money = uInfo[uid]["money"];
			count = uInfo[uid]["count"];
		#print "会员",uid, day,money,count
		context += str(money) + ",\t"+str(count)+",\t"
		#print context;
		
		if uid not in memberCountMoney:
			memberCountMoney[uid] = {"count":0, "money":0};
		memberCountMoney[uid]["count"] += count;
		memberCountMoney[uid]["money"] += money;
	
	with open(uidCsv, 'a') as des:
		des.write(context+'\n')

totalInfo = "Total,\t";
for idx in range(tmpMemberDicLen):
	if idx+1 > maxRank:
		break;
	uid = str(tmpMemberDic[idx][0]);
	totalInfo += str(memberCountMoney[uid]["money"]) + ",\t" + str(memberCountMoney[uid]["count"]) + ",\t";
with open(uidCsv, 'a') as des:
		des.write(totalInfo+'\n')
print '耗时:', time.time() - ticks
exit
			
