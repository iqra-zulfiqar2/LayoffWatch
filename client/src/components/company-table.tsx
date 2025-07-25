import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter,
  ArrowUpDown,
  ExternalLink,
  MapPin,
  Calendar,
  TrendingDown,
  Building2,
  DollarSign
} from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  location: string;
  industry: string;
  layoffCount: number;
  layoffDate: string;
  percentage: string;
  stage: string;
  raised: string;
  country: string;
  dateAdded: string;
  source: string;
  logoUrl?: string;
  description?: string;
  website?: string;
}

interface CompanyTableProps {
  data?: CompanyData[];
  isLoading?: boolean;
}

export function CompanyTable({ data, isLoading }: CompanyTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof CompanyData>("layoffDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Get company logos from a service or use fallback
  const getCompanyLogo = (companyName: string) => {
    const cleanName = companyName.toLowerCase().replace(/\s+/g, '');
    // Use Clearbit logo API or similar service
    return `https://logo.clearbit.com/${cleanName}.com`;
  };

  const getIndustryColor = (industry: string) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Logistics': 'bg-green-100 text-green-800', 
      'Crypto': 'bg-purple-100 text-purple-800',
      'Consumer': 'bg-orange-100 text-orange-800',
      'Real Estate': 'bg-yellow-100 text-yellow-800',
      'Retail': 'bg-pink-100 text-pink-800',
      'Product': 'bg-indigo-100 text-indigo-800',
      'Data': 'bg-cyan-100 text-cyan-800',
      'Hardware': 'bg-amber-100 text-amber-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[industry as keyof typeof colors] || colors.Other;
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'Post-IPO': 'bg-emerald-100 text-emerald-800',
      'Series E': 'bg-blue-100 text-blue-800',
      'Series D': 'bg-violet-100 text-violet-800',
      'Seed': 'bg-orange-100 text-orange-800',
      'Unknown': 'bg-gray-100 text-gray-800',
      'Acquired': 'bg-teal-100 text-teal-800'
    };
    return colors[stage as keyof typeof colors] || colors.Unknown;
  };

  const formatCurrency = (amount: string) => {
    if (!amount || amount === '$0') return '-';
    return amount;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];
    
    let filtered = data.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
      const matchesCountry = countryFilter === "all" || company.country === countryFilter;
      const matchesStage = stageFilter === "all" || company.stage === stageFilter;
      
      return matchesSearch && matchesIndustry && matchesCountry && matchesStage;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string | number | undefined = a[sortField];
      let bValue: string | number | undefined = b[sortField];
      
      if (sortField === 'layoffDate' || sortField === 'dateAdded') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (sortField === 'layoffCount') {
        aValue = aValue ? parseInt(aValue.toString()) : 0;
        bValue = bValue ? parseInt(bValue.toString()) : 0;
      }
      
      if (aValue !== undefined && bValue !== undefined) {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [data, searchTerm, industryFilter, countryFilter, stageFilter, sortField, sortDirection]);

  const handleSort = (field: keyof CompanyData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Mock data matching the image format
  const mockData: CompanyData[] = [
    {
      id: '1',
      name: 'WiseTech',
      location: 'Sydney, Australia',
      industry: 'Logistics',
      layoffCount: 0,
      layoffDate: '7/23/2025',
      percentage: '0%',
      stage: 'Post-IPO',
      raised: '$3,000',
      country: 'Australia',
      dateAdded: '7/24/2025',
      source: 'https://www.reuters.com',
      website: 'wisetech.com'
    },
    {
      id: '2', 
      name: 'ConsenSys',
      location: 'New York, NY',
      industry: 'Crypto',
      layoffCount: 47,
      layoffDate: '7/22/2025',
      percentage: '7%',
      stage: 'Series D',
      raised: '$726',
      country: 'United States',
      dateAdded: '7/23/2025',
      source: 'https://www.bloomberg.com',
      website: 'consensys.net'
    },
    {
      id: '3',
      name: 'Zeen',
      location: 'SF Bay Area, CA',
      industry: 'Consumer',
      layoffCount: 0,
      layoffDate: '7/21/2025',
      percentage: '100%',
      stage: 'Unknown',
      raised: '$9',
      country: 'United States',
      dateAdded: '7/23/2025',
      source: 'https://www.businessinsider.com',
      website: 'zeen.com'
    },
    {
      id: '4',
      name: 'Rocket Companies',
      location: 'Detroit, MI',
      industry: 'Real Estate',
      layoffCount: 0,
      layoffDate: '7/18/2025',
      percentage: '2%',
      stage: 'Post-IPO',
      raised: '$5,200',
      country: 'United States',
      dateAdded: '7/23/2025',
      source: 'https://www.housingwire.com',
      website: 'rocketcompanies.com'
    },
    {
      id: '5',
      name: 'Amazon',
      location: 'Seattle, WA',
      industry: 'Retail',
      layoffCount: 0,
      layoffDate: '7/17/2025',
      percentage: '0%',
      stage: 'Post-IPO',
      raised: '$8,100',
      country: 'United States',
      dateAdded: '7/19/2025',
      source: 'https://www.reuters.com',
      website: 'amazon.com'
    },
    {
      id: '6',
      name: 'Amicole',
      location: 'New York, NY',
      industry: 'Retail',
      layoffCount: 0,
      layoffDate: '7/17/2025',
      percentage: '100%',
      stage: 'Seed',
      raised: '$5',
      country: 'United States',
      dateAdded: '7/19/2025',
      source: 'https://techcrunch.com',
      website: 'amicole.com'
    },
    {
      id: '7',
      name: 'CodeParrot',
      location: 'Bengaluru, India',
      industry: 'Product',
      layoffCount: 0,
      layoffDate: '7/17/2025',
      percentage: '100%',
      stage: 'Seed',
      raised: '-',
      country: 'India',
      dateAdded: '7/19/2025',
      source: 'https://inc42.com',
      website: 'codeparrot.com'
    },
    {
      id: '8',
      name: 'Scale AI',
      location: 'SF Bay Area, CA',
      industry: 'Data',
      layoffCount: 200,
      layoffDate: '7/16/2025',
      percentage: '14%',
      stage: 'Series E',
      raised: '$602',
      country: 'United States',
      dateAdded: '7/17/2025',
      source: 'https://www.bloomberg.com',
      website: 'scale.com'
    }
  ];

  const displayData = data || mockData;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading company data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Layoff Tracker
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedData.length} companies • Real-time layoff data
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Logistics">Logistics</SelectItem>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Consumer">Consumer</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Sweden">Sweden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[250px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('name')}
                    className="font-semibold hover:bg-transparent p-0 h-auto"
                  >
                    Company
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('location')}
                    className="font-semibold hover:bg-transparent p-0 h-auto"
                  >
                    Location
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('layoffCount')}
                    className="font-semibold hover:bg-transparent p-0 h-auto"
                  >
                    # Laid Off
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('layoffDate')}
                    className="font-semibold hover:bg-transparent p-0 h-auto"
                  >
                    Date
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">$ Raised</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('dateAdded')}
                    className="font-semibold hover:bg-transparent p-0 h-auto"
                  >
                    Date Added
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((company) => (
                <TableRow key={company.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={getCompanyLogo(company.website || company.name)} 
                          alt={`${company.name} logo`}
                        />
                        <AvatarFallback className="text-xs">
                          {company.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{company.name}</div>
                        {company.website && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {company.website}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      {company.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {company.layoffCount > 0 ? (
                        <div className="flex items-center text-red-600 font-medium">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {company.layoffCount.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center text-sm">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      {formatDate(company.layoffDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {company.percentage !== '0%' ? (
                      <Badge variant="destructive" className="text-xs">
                        {company.percentage}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getIndustryColor(company.industry)}`}>
                      {company.industry}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={company.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Source
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStageColor(company.stage)}`}>
                      {company.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end text-sm">
                      <DollarSign className="w-3 h-3 mr-1 text-gray-400" />
                      {formatCurrency(company.raised)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {company.country}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(company.dateAdded)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredAndSortedData.length === 0 && (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No companies found matching your filters.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setIndustryFilter("all");
                setCountryFilter("all");
                setStageFilter("all");
              }}
              className="mt-2"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}