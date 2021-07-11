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

    if (!tickerRecordId) {
        const companies = await fetch(`https://financialmodelingprep.com/api/v3/profile/${upperCaseTicker}?apikey=7d86e4fdf1d1e51adcbfad58c7e45d15`)
            .then(response => response.json());
        const companyName = companies.length && companies[0].companyName;
        const exchange = companies.length && companies[0].exchangeShortName;
        
        if (!companyName) {
            throw('Stock Symbol does not exists');
        }

        tickerRecordId = await stockTable.createRecordAsync({
            Symbol: upperCaseTicker,
            Name: companyName,
            Exchange: exchange,
        });
    }

    queueTable.createRecordAsync({
        'Stock': [{id: tickerRecordId}],
    });
    setStockRecordId(tickerRecordId);
}

function ChartSection({ data, stockRecordId, stockTable }) {
    const stockRecord = useRecordById(stockTable, stockRecordId);
    const ticker = stockRecord.getCellValue('Symbol');
    const exchange = stockRecord.getCellValue('Exchange');

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
    const rule40Table = base.getTable('Rule40');
    const [ticker, setTicker] = useState('');
    const [stockRecordId, setStockRecordId] = useState(null);
    let rule40Records = useRecords(rule40Table);
    let data;

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

    if (stockRecordId) {
        const tickerData = rule40Records
            .filter(record => record.getCellValue('Stock')[0].id === stockRecordId)
            .map(record => ({
                Date: record.getCellValue('Date'),
                Score: record.getCellValue('Score'),
                EbitaRatio: record.getCellValue('EbitaRatio'),
                AnnualGrowth: record.getCellValue('AnnualGrowth'),
            }))
            .sort((a, b) => new Date(a.Date) - new Date(b.Date));
        data = {
            datasets: [{
                label: ticker.toUpperCase(),
                data: tickerData,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
            }],
        }
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
                data={data}
                stockRecordId={stockRecordId}
                stockTable={stockTable}
            /> : ''
        }
    </Box>;
}

initializeBlock(() => <MachampApp />);
