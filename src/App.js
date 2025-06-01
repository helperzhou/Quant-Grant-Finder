import React, { useState } from 'react'
import styled from 'styled-components'
import { Table, Input, Select, Button, Spin, message, Typography, Space, Row, Col } from 'antd'
import { SearchOutlined, DownloadOutlined, LinkOutlined } from '@ant-design/icons'
import axios from 'axios'
import QuantIcon from './QuantilytixO.png'
import BackgroundImage from './bg-image.jpg'
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { db } from '../src/firebase/firebaseConfig'

const { Title } = Typography
const { Option } = Select

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background: url(${BackgroundImage}) repeat center center/cover;
  position: relative;
  padding: 20px;
`
const GlassContainer = styled.div`
  background: rgba(255,255,255,0.22);
  border-radius: 16px;
  padding: 30px;
  width: 100%;
  max-width: 1020px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.11);
  border: 1px solid rgba(255,255,255,0.25);
  margin-top: 32px;
`
const Logo = styled.img`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 150px;
  height: auto;
  opacity: 0.9;
`

function grantsToCsv(grants) {
  if (!grants.length) return ''
  const headers = [
    'Grant name/title',
    'Short summary',
    'Funding organization',
    'Grant value',
    'Application deadline',
    'Eligible countries',
    'Sector/field',
    'link URL'
  ]
  const csvRows = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
  ]
  grants.forEach(grant => {
    csvRows.push(
      headers
        .map(h => {
          let val = grant[h]
          if (Array.isArray(val)) val = val.join('; ')
          if (val === undefined || val === null) val = ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(',')
    )
  })
  return csvRows.join('\n')
}

const App = () => {
  const [searchMode, setSearchMode] = useState('keywords')
  const [searchTerms, setSearchTerms] = useState('')
  const [searchURL, setSearchURL] = useState('')
  const [grants, setGrants] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const queryValue = searchMode === 'keywords' ? searchTerms.trim() : searchURL.trim()
    if (!queryValue) {
      message.warning('Please enter search terms or a URL.')
      setLoading(false)
      return
    }
    try {
      // Check Firestore cache
      const q = query(
        collection(db, 'grantQueries'),
        where('mode', '==', searchMode),
        where('query', '==', queryValue)
      )
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const cachedData = snapshot.docs[0].data()
        setGrants(cachedData.results || [])
        setLoading(false)
        return
      }
      // API call
      let response
      if (searchMode === 'keywords') {
        const termsArray = queryValue
          .split('\n')
          .map(term => term.trim())
          .filter(term => term)
        response = await axios.post(
          'https://rairo-qxgrants-api.hf.space/scrape',
          { search_terms: termsArray }
        )
      } else {
        response = await axios.post(
          'https://rairo-qxgrants-api.hf.space/scrape_url',
          { url: queryValue }
        )
      }
      const results = response?.data?.grants || []
      setGrants(results)
      if (results.length > 0) {
        await addDoc(collection(db, 'grantQueries'), {
          mode: searchMode,
          query: queryValue,
          timestamp: Timestamp.now(),
          results
        })
      }
    } catch (error) {
      console.error('Error fetching grants:', error)
      message.error('Failed to fetch grant data.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!grants.length) {
      message.warning('No results to export.')
      return
    }
    const csv = grantsToCsv(grants)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quantilytix-grants-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: 'Grant Name',
      dataIndex: 'Grant name/title',
      key: 'Grant name/title',
      sorter: (a, b) => (a['Grant name/title'] || '').localeCompare(b['Grant name/title'] || ''),
      render: text => text || 'N/A'
    },
    {
      title: 'Summary',
      dataIndex: 'Short summary',
      key: 'Short summary',
      render: text => text || 'N/A'
    },
    {
      title: 'Organization',
      dataIndex: 'Funding organization',
      key: 'Funding organization',
      sorter: (a, b) => (a['Funding organization'] || '').localeCompare(b['Funding organization'] || ''),
      render: text => text || 'N/A'
    },
    {
      title: 'Value',
      dataIndex: 'Grant value',
      key: 'Grant value',
      sorter: (a, b) => {
        const aVal = typeof a['Grant value'] === 'number' ? a['Grant value'] : 0
        const bVal = typeof b['Grant value'] === 'number' ? b['Grant value'] : 0
        return aVal - bVal
      },
      render: value =>
        typeof value === 'number'
          ? `$${value.toLocaleString()}`
          : value && value !== 'Not specified'
          ? value
          : 'N/A'
    },
    {
      title: 'Deadline',
      dataIndex: 'Application deadline',
      key: 'Application deadline',
      sorter: (a, b) => (a['Application deadline'] || '').localeCompare(b['Application deadline'] || ''),
      render: text => text || 'N/A'
    },
    {
      title: 'Countries',
      dataIndex: 'Eligible countries',
      key: 'Eligible countries',
      sorter: (a, b) => (a['Eligible countries'] || '').localeCompare(b['Eligible countries'] || ''),
      render: text => text || 'N/A'
    },
    {
      title: 'Sector',
      dataIndex: 'Sector/field',
      key: 'Sector/field',
      sorter: (a, b) => (a['Sector/field'] || '').localeCompare(b['Sector/field'] || ''),
      render: text => text || 'N/A'
    },
    {
      title: 'Explore',
      dataIndex: 'link URL',
      key: 'link URL',
      render: url =>
        url && url !== 'Not specified'
          ? (
            <Button
              type="primary"
              icon={<LinkOutlined />}
              size="small"
              href={url.startsWith('http') ? url : `https://${url.split(' ')[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!url || url === 'Not specified'}
              style={{ minWidth: 92 }}
            >
              Explore
            </Button>
          ) : (
            <Button type="default" size="small" disabled>
              No Link
            </Button>
          )
    }
  ]

  return (
    <PageWrapper>
      <GlassContainer>
        <Title style={{ color: '#1677ff', textAlign: 'left', marginBottom: 16 }}>Quantilytix Grant Finder</Title>
        {/* Search controls */}
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={24} md={24} lg={24}>
            <Select
              value={searchMode}
              onChange={setSearchMode}
              style={{ width: 220, marginBottom: 8 }}
            >
              <Option value="keywords">Search by Keywords</Option>
              <Option value="url">Search by URL</Option>
            </Select>
          </Col>
        </Row>
        <Row gutter={12} style={{ marginBottom: 10 }}>
          <Col xs={24} sm={18} md={20}>
            <Input.TextArea
              rows={searchMode === 'keywords' ? 4 : 2}
              value={searchMode === 'keywords' ? searchTerms : searchURL}
              onChange={e =>
                searchMode === 'keywords'
                  ? setSearchTerms(e.target.value)
                  : setSearchURL(e.target.value)
              }
              placeholder={
                searchMode === 'keywords'
                  ? 'E.g., Renewable Energy Grants, Climate Change Research Grants'
                  : 'Paste a URL e.g. https://www.afdb.org/en/news-and-events/loans-grants'
              }
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.8)'
              }}
              onPressEnter={e => {
                if (searchMode === 'url' || (searchMode === 'keywords' && e.ctrlKey)) handleSearch()
              }}
            />
          </Col>
          <Col xs={24} sm={6} md={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              icon={<SearchOutlined />}
              type="primary"
              loading={loading}
              onClick={handleSearch}
              style={{ fontWeight: 'bold', width: '100%' }}
              size="large"
            >
              Explore
            </Button>
          </Col>
        </Row>
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={12}>
            {/* Sorting is built-in to Antd Table, but you can add custom controls here if you want */}
          </Col>
          <Col xs={24} sm={12} md={12} style={{ textAlign: 'right' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              disabled={!grants.length}
              style={{ marginBottom: 8 }}
            >
              Export CSV
            </Button>
          </Col>
        </Row>
        {loading ? (
          <Spin tip="Searching grants..." size="large" style={{ marginTop: 40 }} />
        ) : grants.length > 0 ? (
          <Table
            dataSource={grants}
            columns={columns}
            rowKey={(record, idx) =>
              record['Grant name/title'] + '-' + (record['Funding organization'] || idx)
            }
            bordered
            pagination={{ pageSize: 10 }}
            style={{ background: 'rgba(255,255,255,0.93)', borderRadius: 8 }}
          />
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 16 }}>
            😕 No grants found for your search. Try different terms.
          </Typography.Text>
        )}
      </GlassContainer>
      <Logo src={QuantIcon} alt='Quantilytix Logo' />
    </PageWrapper>
  )
}

export default App
