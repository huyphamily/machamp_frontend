import { initializeBlock, useBase, useRecords, useRecordById } from '@airtable/blocks/ui';
import React, { useState }  from 'react';
import { Box, Button, FormField, Heading, Input } from "@airtable/blocks/ui";
import LineChart from "./LineChart";
import TradingViewWidget from 'react-tradingview-widget';

async function queryTicker({
    ticker,
    stockTable,
    queueTable,
    setStockRecordId,
}) {
    const queryResult = stockTable.selectRecords();
    const upperCaseTicker = ticker.toUpperCase();

    await queryResult.loadDataAsync();

    const tickerRecord = queryResult.records.find((record) => {
        return record.getCellValue(stockTable.primaryField) === upperCaseTicker
    });
    let tickerRecordId = tickerRecord && tickerRecord.id;

    if (!tickerRecord) {
        const companies = await fetch(`https://financialmodelingprep.com/api/v3/profile/${upperCaseTicker}?apikey=7d86e4fdf1d1e51adcbfad58c7e45d15`)
            .then(response => response.json());
        const company = companies.length && companies[0];
        
        if (!company) {
            throw('Stock Symbol does not exists');
        }

        tickerRecordId = await stockTable.createRecordAsync({
            Symbol: upperCaseTicker,
            Name: company.companyName,
            Exchange: company.exchangeShortName,
            Country: company.country,
            MarketCap: company.mktCap,
        });
        queueTable.createRecordAsync({
            'Stock': [{id: tickerRecordId}],
        });
    } else {
        const rule40Query = tickerRecord.selectLinkedRecordsFromCell('Rule40');
        await rule40Query.loadDataAsync();
        const latestRule40 = rule40Query.records.slice().sort((a, b) => new Date(b.Date) - new Date(a.Date))[0];
        if (latestRule40) {
            const currentDate = new Date();
            const twoMonthOut = new Date(latestRule40.getCellValue('Date'));
            twoMonthOut.setMonth(twoMonthOut.getMonth() + 2);
            twoMonthOut.setDate(twoMonthOut.getDate() + 15);

            if ((currentDate > twoMonthOut)) {
                queueTable.createRecordAsync({
                    'Stock': [{id: tickerRecordId}],
                });
            }
        }

        rule40Query.unloadData();
    }

    queryResult.unloadData();
    setStockRecordId(tickerRecordId);
}

function ChartSection({ stockRecordId, stockTable }) {
    const stockRecord = useRecordById(stockTable, stockRecordId);
    const ticker = stockRecord.getCellValue('Symbol');
    const exchange = stockRecord.getCellValue('Exchange');

    const rule40Query = stockRecord.selectLinkedRecordsFromCell('Rule40');
    const rule40Records = useRecords(rule40Query);
    const tickerData = rule40Records.map(record => ({
            Date: record.getCellValue('Date'),
            Score: record.getCellValue('Score'),
            EbitaRatio: record.getCellValue('EbitaRatio'),
            AnnualGrowth: record.getCellValue('AnnualGrowth'),
        }))
        .sort((a, b) => new Date(a.Date) - new Date(b.Date));

    const data = {
        datasets: [{
            label: ticker.toUpperCase(),
            data: tickerData,
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
        }],
    }

    return <Box padding={2}>
        <LineChart title="Score" data={data} options={{
            parsing: {
                xAxisKey: 'Date',
                yAxisKey: 'Score'
            }
        }} />
        <LineChart title="Ebita Ratio" data={data} options={{
            parsing: {
                xAxisKey: 'Date',
                yAxisKey: 'EbitaRatio'
            }
        }} />
        <LineChart title="Annual Growth" data={data} options={{
            parsing: {
                xAxisKey: 'Date',
                yAxisKey: 'AnnualGrowth'
            }
        }} />
        <Box marginTop={2} padding={2}>
            <Heading>Price</Heading>
            <Box height='400px' width='80%' margin='auto' >
                <TradingViewWidget
                    symbol={`${exchange}:${ticker}`}
                    autosize
                />
            </Box>
        </Box>
    </Box>;
}

function MachampApp() {
    const base = useBase();
    const stockTable = base.getTable('Stock');
    const queueTable = base.getTable('R40Queue');
    const [ticker, setTicker] = useState('');
    const [stockRecordId, setStockRecordId] = useState(null);

    const onSubmit = async (event) => {
        event.preventDefault();

        queryTicker({
            ticker,
            stockTable,
            queueTable,
            setStockRecordId,
        });
    };

    const onChange = (event) => {
        event.preventDefault();
        setTicker(event.target.value);
        setStockRecordId(null);
    }

    return <Box padding={2}>
        <form onSubmit={onSubmit}>
            <FormField label="Symbol">
                <Input
                    value={ticker}
                    onChange={onChange}
                    placeholder="AAPL"
                />
            </FormField>
            <Button type="submit">Search</Button>
        </form>
        {stockRecordId ?
            <ChartSection
                base={base}
                stockRecordId={stockRecordId}
                stockTable={stockTable}
            /> : ''
        }
    </Box>;
}

initializeBlock(() => <MachampApp />);
