import { initializeBlock, useBase, useRecords } from '@airtable/blocks/ui';
import React, { useState }  from 'react';
import { Box, Button, FormField, Input } from "@airtable/blocks/ui";
import LineChart from "./LineChart";

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
        
        if (!companyName) {
            throw('Stock Symbol does not exists');
        }

        tickerRecordId = await stockTable.createRecordAsync({
            Symbol: upperCaseTicker,
            Name: companyName,
        });
    }

    queueTable.createRecordAsync({
        'Stock': [{id: tickerRecordId}],
    });
    setStockRecordId(tickerRecordId);
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
            .reverse();
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
        <form onSubmit={e => onSubmit(e)}>
            <FormField label="Symbol">
                <Input
                    value={ticker}
                    onChange={e => onChange(e)}
                    placeholder="AAPL"
                />
            </FormField>
            <Button type="submit">Search</Button>
        </form>
        {stockRecordId ? <div>
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
        </div> : ''}
    </Box>;
}

initializeBlock(() => <MachampApp />);
