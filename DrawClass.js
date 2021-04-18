#!/usr/bin/env node

/*
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * 2019 Øyvind Berntsen
 * Title: Draw
 *
 * Simple way to draw a picture in my neopixel bookshelf.
 */

// Requirements
/*const OPC = new require('./opc/opc');
const client = new OPC('localhost', 7890);
const express = require('express');
const http = express();
const port = 3000;
const fs = new require('fs');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();*/

class Draw {
  constructor(client, OPC, switchGame, http) {
    this.client = client;
    this.OPC = OPC;
    this.http = http;
    this.fs = new require('fs');
    this.bodyParser = new require('body-parser');
    this.jsonParser = this.bodyParser.json();
    this.switchGame = switchGame;
    this.rainbowIntensity = 0.7;
    this.rainbowSpeed = 0.002;
    this.start = new Date();
    this.gridSize = [28, 64]; // 28*64 = 1792 total pixels
    this.blinkSpeed = 5000;
    this.joyMapping = {
      12: 'return',
      13: 'restart',
      0: 'up',
      1: 'down',
      2: 'left',
      3: 'right',
      7: 'up',
      4: 'down',
      6: 'left',
      5: 'right'
    };
    this.picture = [{"point":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[528,529,530,531,532,533,534,535,536,537,538,539,540,541,542,543],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[592,593,594,595,596,597,598,599,600,601,602,603,604,605,606,607],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[672,673,674,675,676,677,678,679,680,681,682,683,684,685,686,687],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[688,689,690,691,692,693,694,695,696,697,698,699,700,701,702,703],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[704,705,706,707,708,709,710,711,712,713,714,715,716,717,718,719],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[720,721,722,723,724,725,726,727,728,729,730,731,732,733,734,735],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[736,737,738,739,740,741,742,743,744,745,746,747,748,749,750,751],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[752,753,754,755,756,757,758,759,760,761,762,763,764,765,766,767],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[768,769,770,771,772,773,774,775,776,777,778,779,780,781,782,783],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[784,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[800,801,802,803,804,805,806,807,808,809,810,811,812,813,814,815],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[816,817,818,819,820,821,822,823,824,825,826,827,828,829,830,831],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[832,833,834,835,836,837,838,839,840,841,842,843,844,845,846,847],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[848,849,850,851,852,853,854,855,856,857,858,859,860,861,862,863],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[864,865,866,867,868,869,870,871,872,873,874,875,876,877,878,879],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[880,881,882,883,884,885,886,887,888,889,890,891,892,893,894,895],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[944,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[960,961,962,963,964,965,966,967,968,969,970,971,972,973,974,975],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[976,977,978,979,980,981,982,983,984,985,986,987,988,989,990,991],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[992,993,994,995,996,997,998,999,1000,1001,1002,1003,1004,1005,1006,1007],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070,1071],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1072,1073,1074,1075,1076,1077,1078,1079,1080,1081,1082,1083,1084,1085,1086,1087],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1104,1105,1106,1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,1117,1118,1119],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1120,1121,1122,1123,1124,1125,1126,1127,1128,1129,1130,1131,1132,1133,1134,1135],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1136,1137,1138,1139,1140,1141,1142,1143,1144,1145,1146,1147,1148,1149,1150,1151],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1152,1153,1154,1155,1156,1157,1158,1159,1160,1161,1162,1163,1164,1165,1166,1167],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1168,1169,1170,1171,1172,1173,1174,1175,1176,1177,1178,1179,1180,1181,1182,1183],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1184,1185,1186,1187,1188,1189,1190,1191,1192,1193,1194,1195,1196,1197,1198,1199],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1200,1201,1202,1203,1204,1205,1206,1207,1208,1209,1210,1211,1212,1213,1214,1215],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1216,1217,1218,1219,1220,1221,1222,1223,1224,1225,1226,1227,1228,1229,1230,1231],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1232,1233,1234,1235,1236,1237,1238,1239,1240,1241,1242,1243,1244,1245,1246,1247],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},           
               {"point":[1248,1249,1250,1251,1252,1253,1254,1255,1256,1257,1258,1259,1260,1261,1262,1263],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1264,1265,1266,1267,1268,1269,1270,1271,1272,1273,1274,1275,1276,1277,1278,1279],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1280,1281,1282,1283,1284,1285,1286,1287,1288,1289,1290,1291,1292,1293,1294,1295],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1296,1297,1298,1299,1300,1301,1302,1303,1304,1305,1306,1307,1308,1309,1310,1311],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1312,1313,1314,1315,1316,1317,1318,1319,1320,1321,1322,1323,1324,1325,1326,1327],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1328,1329,1330,1331,1332,1333,1334,1335,1336,1337,1338,1339,1340,1341,1342,1343],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1344,1345,1346,1347,1348,1349,1350,1351,1352,1353,1354,1355,1356,1357,1358,1359],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1360,1361,1362,1363,1364,1365,1366,1367,1368,1369,1370,1371,1372,1373,1374,1375],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1376,1377,1378,1379,1380,1381,1382,1383,1384,1385,1386,1387,1388,1389,1390,1391],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1392,1393,1394,1395,1396,1397,1398,1399,1400,1401,1402,1403,1404,1405,1406,1407],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1408,1409,1410,1411,1412,1413,1414,1415,1416,1417,1418,1419,1420,1421,1422,1423],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1424,1425,1426,1427,1428,1429,1430,1431,1432,1433,1434,1435,1436,1437,1438,1439],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1440,1441,1442,1443,1444,1445,1446,1447,1448,1449,1450,1451,1452,1453,1454,1455],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1456,1457,1458,1459,1460,1461,1462,1463,1464,1465,1466,1467,1468,1469,1470,1471],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1472,1473,1474,1475,1476,1477,1478,1479,1480,1481,1482,1483,1484,1485,1486,1487],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1488,1489,1490,1491,1492,1493,1494,1495,1496,1497,1498,1499,1500,1501,1502,1503],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1504,1505,1506,1507,1508,1509,1510,1511,1512,1513,1514,1515,1516,1517,1518,1519],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1520,1521,1522,1523,1524,1525,1526,1527,1528,1529,1530,1531,1532,1533,1534,1535],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1536,1537,1538,1539,1540,1541,1542,1543,1544,1545,1546,1547,1548,1549,1550,1551],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1552,1553,1554,1555,1556,1557,1558,1559,1560,1561,1562,1563,1564,1565,1566,1567],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1568,1569,1570,1571,1572,1573,1574,1575,1576,1577,1578,1579,1580,1581,1582,1583],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1584,1585,1586,1587,1588,1589,1590,1591,1592,1593,1594,1595,1596,1597,1598,1599],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1600,1601,1602,1603,1604,1605,1606,1607,1608,1609,1610,1611,1612,1613,1614,1615],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1616,1617,1618,1619,1620,1621,1622,1623,1624,1625,1626,1627,1628,1629,1630,1631],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1632,1633,1634,1635,1636,1637,1638,1639,1640,1641,1642,1643,1644,1645,1646,1647],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1648,1649,1650,1651,1652,1653,1654,1655,1656,1657,1658,1659,1660,1661,1662,1663],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1664,1665,1666,1667,1668,1669,1670,1671,1672,1673,1674,1675,1676,1677,1678,1679],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1680,1681,1682,1683,1684,1685,1686,1687,1688,1689,1690,1691,1692,1693,1694,1695],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1696,1697,1698,1699,1700,1701,1702,1703,1704,1705,1706,1707,1708,1709,1710,1711],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1712,1713,1714,1715,1716,1717,1718,1719,1720,1721,1722,1723,1724,1725,1726,1727],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1728,1729,1730,1731,1732,1733,1734,1735,1736,1737,1738,1739,1740,1741,1742,1743],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1744,1745,1746,1747,1748,1749,1750,1751,1752,1753,1754,1755,1756,1757,1758,1759],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1760,1761,1762,1763,1764,1765,1766,1767,1768,1769,1770,1771,1772,1773,1774,1775],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8},
               {"point":[1776,1777,1778,1779,1780,1781,1782,1783,1784,1785,1786,1787,1788,1789,1790,1791],"r":21,"g":255,"b":0,"special":"rainbow","speed":0.002,"intensity":0.8}
            ];

    // Set up HTTP server
    http.post('/node/draw', this.jsonParser, (request, response) => {
      this.picture = request.body;
      response.send('Ok');
    });
  }
  
  onJoyButton(input) {
    // Only respond to keydown, and ignore other buttons than those mapped.
    const key = this.joyMapping[input.number];
    if (input.value && key && key === 'return') {
      this.switchGame();
    }
  }

  draw() {
    let i;
    let j;
    let color;
    let hue;
    let millis = (new Date() - this.start);
    let blinkMillis;
    const notBlack = [];

    // Paint the picture
    for (i = 0; i < this.picture.length; i += 1) {
      const geom = this.picture[i];
      for (j = 0; j < geom.point.length; j += 1) {

        // Set point color
        if (geom.special === 'rainbow') {
          if (!geom.speed) { geom.speed = this.rainbowSpeed; }
          if (!geom.intensity) { geom.intensity = this.rainbowIntensity; }
          // The multiplied factor at the end determines the change of color between each
          // pixel, so the "length" of each color along the strip
          hue = (millis * geom.speed + geom.point[j] * 0.5) % 100;
          color = this.OPC.hsv(hue / 100, 1, geom.intensity);
        } else if (geom.special === 'blink') {
          if (!geom.speed) { geom.speed = this.blinkSpeed; }
          if (!geom.blink) {
            geom.blink = new Date();
          }
          blinkMillis = (new Date() - geom.blink);
          if (geom.waxWane) {
            geom.v = blinkMillis / geom.speed;
          } else {
            geom.v = (geom.speed - blinkMillis) / geom.speed;
          }

          if (blinkMillis > geom.speed) {
            geom.blink = new Date();
            geom.waxWane = !geom.waxWane;
          }
          color = this.OPC.hsv(geom.h, geom.s, geom.v);
        } else if (geom.h && geom.s && geom.v) {
          color = this.OPC.hsv(geom.h, geom.s, geom.v);
        } else {
          color = [geom.r,geom.g,geom.b];
        }

        this.client.setPixel(geom.point[j], color[0], color[1], color[2]);
        notBlack.push(geom.point[j]);
      }
    }

    // Set the other pixels black
    for (i = 0; i < 16 * 8 * 14; i += 1) {
      if (notBlack.indexOf(i) === -1) {
        this.client.setPixel(i, 0, 0, 0);
      }
    }
    this.client.writePixels();
  }
}
module.exports = Draw;

//http.listen(port);
//setInterval(draw, 10);
